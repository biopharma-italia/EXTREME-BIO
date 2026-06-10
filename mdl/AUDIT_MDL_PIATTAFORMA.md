# AUDIT COMPLETO — PIATTAFORMA MDL (Medicina del Lavoro)

**Piattaforma**: mdl.bio-clinic.it  
**Data audit**: 2026-06-10  
**Versione analizzata**: commit `a4549db3` (branch `genspark_ai_developer`)  
**Autore audit**: AI Developer (analisi automatizzata completa del codice sorgente)

---

## INDICE

- [SEZIONE A — Relazione Tecnica e Funzionale](#sezione-a)
- [SEZIONE B — Tabella Funzioni Esistenti](#sezione-b)
- [SEZIONE C — Tabella Funzioni Mancanti](#sezione-c)
- [SEZIONE D — Lista Criticità per Gravità](#sezione-d)
- [SEZIONE E — Lista Modifiche Consigliate](#sezione-e)
- [SEZIONE F — Roadmap di Sviluppo](#sezione-f)
- [SEZIONE G — Giudizio Complessivo](#sezione-g)
- [SEZIONE H — Proposta Struttura Ideale della Piattaforma](#sezione-h)

---

<a name="sezione-a"></a>
## SEZIONE A — RELAZIONE TECNICA E FUNZIONALE COMPLETA

### A.1 — Architettura Generale

#### Stack tecnologico
| Componente | Tecnologia | Note |
|---|---|---|
| Frontend | HTML statico + CSS + Vanilla JS (IIFE) | SPA hash-based, nessun framework |
| Backend API | Cloudflare Pages Functions (TypeScript) | 20 endpoint file + 1 middleware |
| Database | Supabase PostgreSQL (PostgREST) | 17 tabelle + 11 enum + RLS |
| Storage | Supabase Storage (bucket `mdl-files`) | PDF, JPEG, PNG, DICOM, max 20MB |
| Auth | Supabase Auth (JWT Bearer) | Verificato via `supabaseAdmin.auth.getUser()` |
| Deploy | Cloudflare Pages (`mdl-bioclinic`) | Progetto separato da bio-clinic e referti |
| CDN/Edge | Cloudflare | Headers di sicurezza, CORS configurabile |

#### Diagramma architettura
```
[Browser SPA] ──HTTPS──▶ [Cloudflare Edge]
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
           [Pages Static]      [Pages Functions]
           index.html           _middleware.ts
           mdl.js               └── 20 API endpoints
           mdl.css
                                      │
                              ┌───────┴───────┐
                              ▼               ▼
                    [Supabase Auth]   [Supabase DB]
                    JWT tokens        17 tables + RLS
                                      │
                                      ▼
                              [Supabase Storage]
                              bucket: mdl-files
```

#### Punti di forza dell'architettura
1. **Serverless completo**: nessun server da gestire, scale automatico
2. **RLS a livello DB**: sicurezza non solo applicativa ma anche a livello dati
3. **Service Role Key nel backend**: il frontend non ha mai accesso diretto al DB con privilegi elevati
4. **Soft delete consistente**: tutte le entità principali usano `is_active` flag
5. **Audit log pervasivo**: quasi tutte le operazioni CRUD registrano un entry in `mdl_audit_log`
6. **Separazione dati clinici**: il codice API rimuove attivamente i campi clinici per DL/RSPP

#### Criticità architetturali
1. **Rate limiting in-memory**: si resetta ad ogni cold start del Worker → inefficace contro attacchi distribuiti
2. **Nessun token refresh automatico**: il frontend non implementa il refresh del JWT → sessioni scadute silenziosamente
3. **Token in localStorage**: vulnerabile a XSS (dovrebbe usare httpOnly cookie)
4. **Istanza Supabase condivisa**: MDL e Referti condividono lo stesso progetto Supabase → rischio di interferenza
5. **6 directory API vuote**: `audit-log`, `documents`, `gdpr`, `reports`, `scheduler`, `training` sono placeholder senza codice
6. **Nessun test automatizzato**: zero file di test in tutto il progetto
7. **Nessun CI/CD pipeline**: deploy manuale via `wrangler pages deploy`

### A.2 — Database: Schema e Relazioni

#### 17 Tabelle (tutte con RLS abilitato)

| # | Tabella | Righe stimate | FK principali | Scopo |
|---|---|---|---|---|
| 1 | `mdl_users` | 1 | → companies | Utenti sistema (auth + profilo MDL) |
| 2 | `mdl_companies` | 3 | — | Aziende clienti |
| 3 | `mdl_company_sites` | 0 | → companies | Sedi operative |
| 4 | `mdl_safety_contacts` | 0 | → companies, → sites | Figure della sicurezza (DL, RSPP, RLS...) |
| 5 | `mdl_job_roles` | 10 | → companies | Mansioni (5 reali + 5 sentinel) |
| 6 | `mdl_workers` | 0 | → companies, → users, → sites | Lavoratori |
| 7 | `mdl_worker_jobs` | 0 | → workers, → job_roles, → sites | Storico mansioni lavoratore |
| 8 | `mdl_protocols` | 10 | → companies, → job_roles, → users | Protocolli sanitari (5 reali + 5 template) |
| 9 | `mdl_protocol_exams` | 103 | → protocols | Accertamenti previsti nel protocollo |
| 10 | `mdl_visits` | 0 | → workers, → companies, → protocols, → users | Visite mediche |
| 11 | `mdl_visit_exams` | 0 | → visits, → protocol_exams | Accertamenti effettuati |
| 12 | `mdl_fitness_judgments` | 0 | → visits, → workers, → companies, → job_roles, → users | Giudizi di idoneità |
| 13 | `mdl_documents` | 0 | → companies, → users | Documenti aziendali (DVR, nomina MC...) |
| 14 | `mdl_training_records` | 0 | → workers | Formazione lavoratori |
| 15 | `mdl_notifications` | 0 | → users, → companies, → workers | Notifiche e scadenzario |
| 16 | `mdl_audit_log` | ~10 | — (solo FK logiche) | Tracciamento accessi (GDPR) |
| 17 | `mdl_gdpr_consents` | 0 | → users, → workers | Consensi privacy |

#### 11 Tipi Enum
`mdl_user_role` (7 valori), `mdl_risk_level` (3), `mdl_worker_contract` (7), `mdl_visit_type` (7), `mdl_visit_status` (6), `mdl_fitness_type` (6), `mdl_exam_periodicity` (6), `mdl_document_type` (13), `mdl_training_type` (22), `mdl_notification_status` (5), `mdl_audit_action` (30)

#### 6 Trigger + 3 Funzioni Helper
- `mdl_update_timestamp()` → trigger su 6 tabelle per aggiornamento `updated_at`
- `mdl_calc_bmi()` → trigger su `mdl_visits` per calcolo automatico BMI
- `mdl_set_appeal_deadline()` → trigger su `mdl_fitness_judgments` per deadline ricorso (issued_date + 30gg)

#### 3 Funzioni RLS Helper
- `mdl_current_user_role()` → ruolo dell'utente corrente
- `mdl_current_user_id()` → ID MDL dell'utente corrente
- `mdl_current_user_company()` → azienda dell'utente corrente

#### Valutazione schema
- **Progettazione**: 8/10 — Schema ben normalizzato, nomenclatura consistente con prefisso `mdl_`, enum ben definiti
- **Relazioni**: 8/10 — FK corrette, ON DELETE CASCADE dove appropriato, UNIQUE constraint sensati
- **Indici**: 7/10 — Indici presenti sui campi filtro principali; mancano indici compositi per query frequenti
- **Conformità normativa**: 8/10 — Campi per art. 41, Allegato 3A, ricorso, conservazione cancerogeni

### A.3 — Gestione Ruoli e Accessi

#### 7 Ruoli definiti nell'enum `mdl_user_role`

| Ruolo | Codice DB | Utenti attivi | Portale dedicato |
|---|---|---|---|
| Super Admin | `super_admin` | 1 (mdl@bio-clinic.it) | Dashboard principale |
| Medico Competente | `medico_competente` | 0 | Dashboard principale |
| Medico Collaboratore | `medico_collaboratore` | 0 | Dashboard principale |
| Segreteria MDL | `segreteria_mdl` | 0 | Dashboard principale |
| Datore di Lavoro | `datore_lavoro` | 0 | Dashboard principale (scoped) |
| RSPP | `rspp` | 0 | Dashboard principale (scoped) |
| Lavoratore | `lavoratore` | 0 | **NESSUNO** (directory vuota) |

#### Matrice Permessi API (analisi endpoint per endpoint)

| Risorsa / Azione | super_admin | MC | MC collab. | segreteria | DL | RSPP | lavoratore |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lista aziende | ✅ | ✅ | ✅ | ✅ | solo propria | solo propria | ❌ |
| Crea azienda | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Modifica azienda | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Elimina azienda | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Lista lavoratori | ✅ | ✅ | ✅ | ✅ | propria azienda | propria azienda | ❌ |
| Crea lavoratore | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Dettaglio lavoratore | ✅ | ✅ | ✅ | ✅ | **sì ma vede dati clinici** | **sì ma vede dati clinici** | ❌ |
| Lista visite | ✅ | ✅ | ✅ | ✅ | solo propria (no clinici) | solo propria (no clinici) | ❌ |
| Crea visita | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Dettaglio visita | ✅ | ✅ | ✅ | ✅ (vede clinici!) | propria (no referti/clinici) | propria (no referti/clinici) | ❌ |
| Giudizio idoneità | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Upload file | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Download file | ✅ | ✅ | ✅ | ✅ | solo idoneità + docs | solo idoneità + docs | ❌ |
| Documenti aziendali | ✅ | ✅ | ✅ | ✅ | propria azienda | propria azienda (solo lettura) | ❌ |
| Mansioni | ✅ | ✅ | ✅ | ✅ | propria azienda (lettura) | propria azienda (lettura) | ❌ |
| Protocolli | ✅ | ✅ | ✅ | ✅ | propria azienda (lettura) | propria azienda (lettura) | ❌ |
| Template protocolli | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Scadenzario | ✅ | ✅ | ✅ | ✅ | propria azienda | propria azienda | ❌ |
| Audit log | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| GDPR consensi | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestione utenti | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

#### Problemi rilevati nella gestione accessi

**CRITICO — Lavoratore non ha accesso**
- Il ruolo `lavoratore` è definito nel DB ma non ha nessun endpoint API dedicato
- Le directory `portale-azienda/` e `portale-lavoratore/` esistono ma sono vuote
- Il lavoratore non può: vedere i propri dati, scaricare il giudizio di idoneità, vedere le proprie visite, dare/revocare consenso GDPR

**CRITICO — Segreteria vede dati clinici nelle visite**
- In `visits/[id]/index.ts` riga 21: `const isClinical = MC_ROLES.includes(ctx.user.role) || ctx.user.role === 'segreteria_mdl'`
- La segreteria NON è un ruolo clinico: non dovrebbe vedere anamnesi, esame obiettivo, conclusioni cliniche
- Violazione D.Lgs. 81/2008 art. 25: solo il MC ha accesso alla cartella sanitaria

**IMPORTANTE — DL vede troppo nella lista lavoratori**
- `workers/[id]/index.ts` (GET) restituisce `select('*')` che include dati sensibili come `is_pregnant`, `is_disabled`, `disability_percentage`
- L'API non filtra i campi sensibili per il DL — dovrebbe mostrare solo dati anagrafici essenziali e stato mansione

**IMPORTANTE — Nessun meccanismo di registrazione utenti**
- Non esiste endpoint `/api/auth/register` (la rotta è nel PUBLIC_ROUTES del middleware ma non ha handler)
- L'unico utente è stato creato direttamente nel DB
- Impossibile creare nuovi medici, segreterie, DL senza accesso diretto al DB

### A.4 — Analisi Sicurezza

| Aspetto | Stato | Valutazione |
|---|---|---|
| Auth JWT | ✅ Implementato via Supabase | Buono |
| CORS configurabile | ✅ Via env `ALLOWED_ORIGINS` | Buono |
| Rate limiting login | ✅ 5 req/min per IP | Debole (in-memory) |
| Security headers | ✅ X-Content-Type-Options, X-Frame-Options, Referrer-Policy | Buono, manca CSP |
| Token storage | ⚠️ localStorage | Vulnerabile a XSS |
| Token refresh | ⚠️ Endpoint esiste ma non usato dal frontend | Token scade silenziosamente |
| Input validation | ✅ Whitelist campi aggiornabili, regex CF, regex P.IVA | Buono |
| SQL injection | ✅ PostgREST parametrizzato | Sicuro |
| File upload validation | ✅ MIME type + size check | Buono |
| RLS policies | ✅ Su tutte le 17 tabelle | Buono |
| Encryption at rest | ⚠️ Campo `is_encrypted` esiste ma non implementato | Solo dichiarativo |
| TOTP/MFA | ⚠️ Campo `totp_enabled` esiste ma non implementato | Solo predisposto |
| Password policy | ❌ Delegata a Supabase default | Nessuna personalizzazione |
| Brute force protection | ⚠️ Solo rate limit in-memory | Insufficiente |
| Audit GDPR | ✅ Parziale — manca su lettura dati sanitari | Incompleto |

### A.5 — Flusso Operativo Reale (stato attuale vs. atteso)

```
FLUSSO IDEALE MDL:
 
1. Creazione azienda          ✅ Implementato (API + frontend)
2. Inserimento sedi           ⚠️ Schema DB esiste, API/frontend mancanti
3. Figure sicurezza (DL,RSPP) ⚠️ Schema DB esiste, API/frontend mancanti
4. Creazione mansioni         ✅ Implementato (API + frontend)
5. Definizione rischi         ✅ Campo risk_factors su job_roles
6. Protocollo sanitario       ✅ Implementato (clone da template)
7. Inserimento lavoratori     ✅ Implementato (API + frontend)
8. Assegnazione mansione      ✅ Implementato (al momento del create worker)
9. Generazione scadenze       ⚠️ Solo via next_visit_date del giudizio
10. Convocazione lavoratori   ❌ NON implementato
11. Prenotazione visita       ✅ Parziale (schedule con data/ora)
12. Invio promemoria          ❌ NON implementato
13. Compilazione anamnesi     ⚠️ Campi DB esistono, form frontend assente
14. Esecuzione visita         ✅ Parziale (cambio stato, dati clinici via API)
15. Inserimento esami         ✅ Implementato (visit_exams via upload referto)
16. Upload referti            ✅ Implementato (file upload + link a visit_exam)
17. Emissione giudizio        ✅ Implementato (API completa con validazione)
18. Firma digitale            ❌ NON implementato (campo signature_method esiste)
19. Stampa certificato        ✅ Implementato (generazione HTML printable)
20. Notifica al lavoratore    ❌ NON implementato
21. Notifica al DL            ❌ NON implementato
22. Consegna documenti        ❌ NON implementato (no portale lavoratore)
23. Archiviazione             ✅ Automatica (soft delete + storage)
24. Monitoraggio scadenze     ✅ Implementato (deadlines API aggregata)
25. Report Allegato 3B        ❌ NON implementato
26. Export cartella sanitaria ❌ NON implementato
27. GDPR export/cancellazione ❌ NON implementato (solo schema)
```

**Copertura flusso**: ~50% del flusso ideale è implementato a livello API, ~40% a livello frontend.

### A.6 — Conformità Normativa

#### D.Lgs. 81/2008

| Requisito | Articolo | Stato | Note |
|---|---|---|---|
| Protocollo sanitario per mansione | Art. 25 c.1 b) | ✅ | Template + clone per azienda |
| Visite preventive/periodiche/ecc. | Art. 41 c.2 | ✅ | 7 tipi di visita nell'enum |
| Giudizio di idoneità | Art. 41 c.6 | ✅ | 6 tipi di giudizio, validazione completa |
| Comunicazione giudizio al DL | Art. 41 c.6-bis | ⚠️ | Campo notified_employer esiste, logica mancante |
| Comunicazione giudizio al lavoratore | Art. 41 c.6-bis | ❌ | Nessun portale lavoratore |
| Ricorso art. 41 c.9 | Art. 41 c.9 | ✅ | Campi appeal_*, trigger deadline 30gg |
| Cartella sanitaria Allegato 3A | Allegato 3A | ⚠️ | Campi anamnesi in visits, form non implementato |
| Allegato 3B (dati aggregati) | Art. 40 | ❌ | Nessun endpoint/report |
| Segreto professionale MC | Art. 25 c.1 | ⚠️ | Separazione parziale (segreteria vede clinici) |
| Conservazione 10/40 anni | Art. 25 c.1 d) | ✅ | Migration 005: vista retention_review |

#### GDPR

| Requisito | Stato | Note |
|---|---|---|
| Base giuridica trattamento | ⚠️ | Tabella gdpr_consents esiste ma nessuna logica |
| Consenso informato | ❌ | Nessun form di raccolta consenso |
| Diritto di accesso (art. 15) | ❌ | Nessun endpoint GDPR export |
| Diritto di cancellazione (art. 17) | ❌ | Nessun endpoint GDPR delete |
| Portabilità dati (art. 20) | ❌ | Nessun export strutturato |
| Registro trattamenti | ❌ | Non documentato |
| Audit accessi art. 9 | ⚠️ | Parziale — log su CUD, manca log su lettura dati sanitari |
| DPO/Responsabile | ❌ | Non gestito nella piattaforma |
| Data retention | ✅ | Funzione cleanup audit 48 mesi + vista review 10/40 anni |
| Separazione dati tra aziende | ✅ | FK company_id + RLS policies |

### A.7 — Analisi UX per Ruolo

#### Segreteria
- **Positivo**: navigazione a schede per azienda (7 tab), grid aziende con ricerca
- **Negativo**: nessun calendario/agenda visivo, nessuna convocazione massiva, nessun filtro rapido scadenze
- **Mancante**: gestione utenti, invio comunicazioni, stampa lettere convocazione

#### Azienda (DL/RSPP)
- **Positivo**: scoping automatico alla propria azienda
- **Negativo**: usa la stessa dashboard della segreteria (no portale dedicato), vede sidebar completa
- **Mancante**: dashboard con KPI aziendali, download elenco scadenze PDF, portale self-service

#### Medico
- **Positivo**: accesso completo a dati clinici, emissione giudizio con validazione, generazione certificato stampabile
- **Negativo**: nessun form strutturato per anamnesi, compilazione clinica solo via API (no form frontend dedicato)
- **Mancante**: cartella sanitaria completa, firma digitale, dettatura vocale, template conclusioni

#### Lavoratore
- **Critico**: NESSUN ACCESSO alla piattaforma
- **Mancante**: tutto — visualizzazione propri dati, download giudizio, storico visite, consenso GDPR

#### Amministratore
- **Positivo**: accesso completo a tutte le funzioni
- **Negativo**: nessun pannello di gestione utenti, nessuna dashboard admin con metriche sistema
- **Mancante**: CRUD utenti, log viewer, configurazione sistema, statistiche utilizzo

---

<a name="sezione-b"></a>
## SEZIONE B — TABELLA FUNZIONI ESISTENTI

| # | Funzione | Endpoint API | Frontend | Stato | Completezza | Errori noti | Criticità | Miglioramenti | Priorità |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Login email/password | POST /auth/login | ✅ Form login | Funzionante | 80% | Nessun recovery password | Media | Aggiungere forgot-password, lockout | Alta |
| 2 | Refresh token | POST /auth/refresh | ❌ Non usato | Parziale | 30% | Frontend non lo invoca | Alta | Implementare auto-refresh nel frontend | Urgente |
| 3 | CRUD Aziende | GET/POST /companies | ✅ Grid + form | Funzionante | 90% | — | Bassa | Validazione ATECO, import massivo | Bassa |
| 4 | Dettaglio azienda | GET/PATCH/DELETE /companies/:id | ✅ Vista dettaglio + 7 tab | Funzionante | 85% | — | Bassa | Storico modifiche | Bassa |
| 5 | CRUD Mansioni | GET/POST /companies/:id/job-roles | ✅ Tab mansioni | Funzionante | 85% | — | Bassa | Lista rischi predefinita | Media |
| 6 | Modifica/elimina mansione | PATCH/DELETE /job-roles/:id | ✅ Inline edit | Funzionante | 80% | — | Bassa | Conferma eliminazione, check dipendenze | Bassa |
| 7 | Lista protocolli template | GET /protocol-templates | ✅ Sezione template | Funzionante | 90% | — | Bassa | — | Bassa |
| 8 | CRUD protocolli template | POST/PATCH/DELETE | ✅ Form + editor esami | Funzionante | 85% | — | Bassa | Versioning template | Bassa |
| 9 | Clone protocollo da template | POST /companies/:id/protocols | ✅ Modal selezione | Funzionante | 90% | — | Bassa | Personalizzazione esami al clone | Media |
| 10 | Protocolli aziendali | GET /companies/:id/protocols | ✅ Tab protocolli con esami | Funzionante | 85% | — | Bassa | — | Bassa |
| 11 | Modifica/elimina protocollo | PATCH/DELETE /protocols/:id | ✅ Editor esami | Funzionante | 80% | Sostituzione totale esami (non incrementale) | Media | Update parziale esami | Media |
| 12 | CRUD Lavoratori | GET/POST /workers | ✅ Lista + form creazione | Funzionante | 75% | Assegnazione mansione solo al create | Media | Cambio mansione successivo | Alta |
| 13 | Dettaglio lavoratore | GET/PATCH /workers/:id | ✅ 6 sub-tab | Funzionante | 70% | DL vede campi sensibili | Alta | Filtrare campi per ruolo | Urgente |
| 14 | Programmazione visita | POST /visits | ✅ Modal creazione | Funzionante | 75% | — | Media | Auto-link protocollo, slot orari | Alta |
| 15 | Lista visite | GET /visits | ✅ Vista globale + per azienda | Funzionante | 80% | — | Bassa | Filtri avanzati, export | Media |
| 16 | Dettaglio visita | GET/PATCH /visits/:id | ✅ Modal completo | Funzionante | 70% | Segreteria vede dati clinici | Alta | Separare vista per ruolo | Urgente |
| 17 | Emissione giudizio idoneità | POST /visits/:id/fitness-judgment | ✅ Form nel modal visita | Funzionante | 85% | — | Bassa | Firma digitale, PDF automatico | Alta |
| 18 | Upload referti | POST /files/upload | ✅ Upload nel dettaglio visita | Funzionante | 80% | — | Bassa | Preview PDF, drag&drop | Bassa |
| 19 | Download file (signed URL) | GET /files/download | ✅ Bottone download | Funzionante | 90% | — | Bassa | — | Bassa |
| 20 | Documenti aziendali | GET/POST/DELETE /companies/:id/documents | ✅ Tab documenti con slot | Funzionante | 85% | — | Bassa | Più tipi documento, scadenze visive | Media |
| 21 | Scadenzario aggregato | GET /deadlines | ✅ Sezione scadenzario | Funzionante | 80% | Solo horizon 90gg default | Bassa | Filtri per categoria, export | Media |
| 22 | Generazione certificato idoneità | Frontend JS (HTML → print) | ✅ Stampa browser | Funzionante | 70% | Solo HTML, nessun PDF reale | Media | Generazione PDF server-side | Alta |
| 23 | Separazione dati clinici DL/RSPP | API-level field stripping | N/A | Funzionante | 75% | Manca su workers/:id GET | Alta | Estendere a tutti gli endpoint | Urgente |
| 24 | Audit log (scrittura) | Inline in ogni endpoint | N/A | Funzionante | 70% | Manca su operazioni di lettura dati sensibili | Media | Aggiungere log lettura | Alta |
| 25 | RLS Database | Migration 002 | N/A | Funzionante | 85% | — | Bassa | Policy più granulari | Media |
| 26 | Data retention (audit cleanup) | Funzione SQL schedulabile | N/A | Predisposto | 50% | Richiede pg_cron non abilitato | Media | Abilitare pg_cron | Media |
| 27 | Data retention (vista review) | Vista SQL mdl_retention_review | N/A | Funzionante | 80% | Solo vista, nessuna azione | Media | Interfaccia admin per gestione | Media |
| 28 | Sedi operative | Schema DB completo | ❌ Nessun frontend | Solo schema | 20% | Nessuna API endpoint | Media | Implementare CRUD completo | Media |
| 29 | Figure sicurezza | Schema DB completo | ❌ Nessun frontend | Solo schema | 20% | Nessuna API endpoint | Media | Implementare CRUD completo | Media |
| 30 | Formazione lavoratori | Schema DB completo | ❌ Nessun frontend | Solo schema | 15% | Nessuna API endpoint, incluso solo in scadenzario | Media | Implementare CRUD completo | Media |
| 31 | Notifiche | Schema DB completo | ❌ Nessun frontend | Solo schema | 10% | Nessuna logica di invio | Alta | Implementare engine notifiche | Alta |
| 32 | Consensi GDPR | Schema DB completo | ❌ Nessun frontend | Solo schema | 10% | Nessuna logica di raccolta | Alta | Form consenso, gestione revoca | Alta |
| 33 | Storico mansioni lavoratore | Schema DB + API partial | ⚠️ Solo read nel dettaglio | Parziale | 40% | Non c'è API per cambio mansione | Media | Endpoint cambio mansione | Alta |

---

<a name="sezione-c"></a>
## SEZIONE C — TABELLA FUNZIONI MANCANTI

| # | Funzione mancante | Attesa in MDL professionale | Tabella DB | API | Frontend | Impatto | Effort (gg) | Priorità |
|---|---|---|---|---|---|---|---|---|
| 1 | **Portale lavoratore** | Il lavoratore deve vedere propri dati, giudizi, visite, dare consenso | Esiste (mdl_workers.user_id) | ❌ | ❌ | Bloccante | 8 | **Urgente** |
| 2 | **Raccolta consenso GDPR** | Obbligatoria per trattamento dati sanitari | Esiste (mdl_gdpr_consents) | ❌ | ❌ | Bloccante (legale) | 3 | **Urgente** |
| 3 | **Registrazione utenti** | Admin deve poter creare nuovi utenti | Esiste (mdl_users) | ❌ | ❌ | Bloccante | 4 | **Urgente** |
| 4 | **Recupero password** | Funzionalità base di ogni piattaforma | Auth Supabase | ❌ | ❌ | Bloccante | 1 | **Urgente** |
| 5 | **Form anamnesi strutturato** | Allegato 3A richiede anamnesi completa | Esiste (campi in mdl_visits) | ⚠️ API accetta campi | ❌ | Bloccante | 5 | **Urgente** |
| 6 | **Convocazione lavoratori** | Generazione lettere/email di convocazione a visita | ❌ | ❌ | ❌ | Importante | 5 | Alta |
| 7 | **Notifiche email/SMS** | Promemoria scadenze, convocazioni, giudizi | Schema esiste | ❌ | ❌ | Importante | 6 | Alta |
| 8 | **Portale azienda dedicato** | Dashboard self-service per il DL | ❌ | ⚠️ Scoping parziale | ❌ (dir vuota) | Importante | 8 | Alta |
| 9 | **Gestione utenti (CRUD)** | Admin deve gestire account | Esiste (mdl_users) | ❌ | ❌ | Importante | 4 | Alta |
| 10 | **Cambio mansione lavoratore** | Con storico, data inizio/fine, trigger protocollo | Esiste (mdl_worker_jobs) | ❌ | ❌ | Importante | 3 | Alta |
| 11 | **Agenda visiva** | Calendario con visite programmate, drag&drop | ❌ | ⚠️ Filtri date su visits | ❌ (placeholder) | Importante | 5 | Alta |
| 12 | **Export PDF cartella sanitaria** | Allegato 3A completo in PDF | ❌ | ❌ | ❌ | Importante | 5 | Alta |
| 13 | **Export PDF giudizio idoneità** | Documento ufficiale con header clinica e firma | ⚠️ HTML printable esiste | ❌ Server-side | ⚠️ Solo stampa browser | Importante | 3 | Alta |
| 14 | **Allegato 3B** | Report aggregato annuale obbligatorio per MC | ❌ | ❌ | ❌ | Importante (normativo) | 5 | Alta |
| 15 | **Firma digitale/elettronica** | Firma del giudizio di idoneità | Schema predisposto | ❌ | ❌ | Importante | 5 | Alta |
| 16 | **Auto-refresh token** | Evita disconnessione silenziosa | Endpoint esiste | ❌ Frontend non usa | ❌ | Importante | 1 | Alta |
| 17 | **CRUD Sedi operative** | Gestione multi-sede azienda | Esiste (mdl_company_sites) | ❌ | ❌ | Media | 2 | Media |
| 18 | **CRUD Figure sicurezza** | DL, RSPP, RLS, Preposti, Addetti | Esiste (mdl_safety_contacts) | ❌ | ❌ | Media | 3 | Media |
| 19 | **CRUD Formazione** | Registro corsi, attestati, scadenze | Esiste (mdl_training_records) | ❌ | ❌ | Media | 4 | Media |
| 20 | **Export Excel** | Liste lavoratori, scadenze, visite | ❌ | ❌ | ❌ | Media | 3 | Media |
| 21 | **Report per MC** | Statistiche visite, giudizi, patologie | ❌ | ❌ | ❌ | Media | 4 | Media |
| 22 | **Report per azienda** | Copertura visite, scadenze, costi | ❌ | ❌ | ❌ | Media | 3 | Media |
| 23 | **Dashboard admin con metriche** | Utenti attivi, volumi, errori | ❌ | ❌ | ❌ | Media | 3 | Media |
| 24 | **Import massivo lavoratori** | Upload CSV/Excel con parsing | ❌ | ❌ | ❌ | Media | 4 | Media |
| 25 | **Visualizzatore audit log** | Interfaccia per consultare i log | Esiste (mdl_audit_log) | ❌ | ❌ | Media | 2 | Media |
| 26 | **GDPR export dati personali** | Diritto art. 15/20 GDPR | ❌ | ❌ | ❌ | Media (legale) | 3 | Media |
| 27 | **GDPR cancellazione dati** | Diritto art. 17 GDPR | Vista retention esiste | ❌ | ❌ | Media (legale) | 3 | Media |
| 28 | **Gestione fatturazione/consuntivi** | Tracciamento visite/esami per azienda → fattura | ❌ | ❌ | ❌ | Bassa | 8 | Futura |
| 29 | **Integrazione laboratorio (HL7/FHIR)** | Ricezione automatica referti dal lab | ❌ | ❌ | ❌ | Bassa | 15 | Futura |
| 30 | **App mobile lavoratore** | Accesso da smartphone | ❌ | ❌ | ❌ | Bassa | 20 | Futura |
| 31 | **Sopralluogo aziendale** | Verbale sopralluogo con checklist | ❌ | ❌ | ❌ | Bassa | 5 | Futura |
| 32 | **Multi-tenant / Multi-clinica** | Più cliniche sullo stesso sistema | ❌ | ❌ | ❌ | Bassa | 15 | Futura |
| 33 | **Telemedicina** | Visite a distanza con consenso | ❌ | ❌ | ❌ | Bassa | 10 | Futura |
| 34 | **Integrazione PEC** | Invio giudizi via PEC certificata | ❌ | ❌ | ❌ | Bassa | 5 | Futura |

---

<a name="sezione-d"></a>
## SEZIONE D — LISTA CRITICITÀ ORDINATE PER GRAVITÀ

### 🔴 BLOCCANTI (impediscono l'utilizzo in produzione)

| # | Criticità | Dove | Rischio | Correzione | Priorità |
|---|---|---|---|---|---|
| D1 | **Lavoratore non ha accesso alla piattaforma** | Nessun endpoint/portale per ruolo `lavoratore` | Violazione art. 41 c.6-bis D.Lgs. 81/2008: il lavoratore deve ricevere copia del giudizio. Violazione GDPR art. 15: diritto di accesso ai propri dati | Implementare portale lavoratore con: login, dashboard personale, storico visite, download giudizi, consenso GDPR | Urgente (8 gg) |
| D2 | **Nessuna raccolta consenso GDPR** | Tabella `mdl_gdpr_consents` vuota, nessuna logica | Trattamento dati sanitari senza base giuridica documentata = illecito trattamento (art. 9 GDPR + art. 2-septies Codice Privacy) | Form di raccolta consenso al primo accesso, con: testo informativa, checkbox consent, timestamp, revoca | Urgente (3 gg) |
| D3 | **Nessun meccanismo di registrazione utenti** | Middleware lista `/api/auth/register` come pubblica ma nessun handler | Impossibile creare nuovi utenti senza accesso diretto al DB. Piattaforma inutilizzabile con più di 1 operatore | Implementare endpoint di registrazione (admin-only) + UI gestione utenti | Urgente (4 gg) |
| D4 | **Nessun recupero password** | Nessun handler per `/api/auth/forgot-password` | Utente bloccato fuori dal sistema se dimentica la password | Implementare forgot-password via Supabase `resetPasswordForEmail()` | Urgente (1 gg) |
| D5 | **Form anamnesi non implementato** | Campi anamnesi in `mdl_visits` esistono ma nessun form frontend | L'Allegato 3A del D.Lgs. 81/2008 richiede anamnesi completa. Senza form il MC non può compilare la cartella sanitaria | Creare form strutturato nel modal visita con: anamnesi familiare, fisiologica, patologica remota/prossima, lavorativa, esame obiettivo | Urgente (5 gg) |

### 🟠 IMPORTANTI (compromettono sicurezza/conformità)

| # | Criticità | Dove | Rischio | Correzione | Priorità |
|---|---|---|---|---|---|
| D6 | **Segreteria vede dati clinici** | `visits/[id]/index.ts` riga 21: segreteria inclusa nei ruoli clinici | Violazione segreto professionale MC (art. 25 D.Lgs. 81/2008). La segreteria deve vedere date, stati, programmazione — MAI anamnesi/conclusioni | Rimuovere `segreteria_mdl` dalla variabile `isClinical` | Alta (0.5 gg) |
| D7 | **DL vede campi sensibili lavoratori** | `workers/[id]/index.ts` GET restituisce `select('*')` | DL vede `is_pregnant`, `is_disabled`, `disability_percentage` — dati che non gli competono | Aggiungere field filtering per DL/RSPP nel GET worker | Alta (1 gg) |
| D8 | **Nessuna gestione utenti** | Nessun endpoint CRUD per `mdl_users` | Admin non può creare MC, segreteria, DL. Piattaforma mono-utente | Implementare `/api/users` con CRUD + invito email | Alta (4 gg) |
| D9 | **Sistema notifiche vuoto** | Directory `scheduler/` e `audit-log/` vuote, nessun engine | Nessun promemoria scadenze, nessuna convocazione, nessun alert | Implementare cron job + email via Resend (chiave già in env) | Alta (6 gg) |
| D10 | **Nessun export cartella sanitaria** | Nessun endpoint PDF/export | Il MC non può stampare/consegnare la cartella sanitaria completa | Implementare generazione PDF con puppeteer o jsPDF | Alta (5 gg) |
| D11 | **Token refresh non implementato** | `mdl.js` non invoca mai `/api/auth/refresh` | Sessione scade dopo ~1h (default Supabase), utente disconnesso senza preavviso | Aggiungere interceptor che rileva 401 e tenta refresh | Alta (1 gg) |
| D12 | **Token in localStorage** | `mdl.js` usa `localStorage.setItem('mdl_token', ...)` | Vulnerabile a XSS: qualsiasi script iniettato può rubare il token | Migrare a httpOnly cookie (richiede modifica middleware) | Alta (2 gg) |
| D13 | **Allegato 3B non implementato** | Nessun report aggregato | Obbligo normativo annuale del MC: dati sanitari aggregati per INAIL | Implementare query aggregata + export in formato standard | Alta (5 gg) |

### 🟡 MEDIE (degradano qualità/usabilità)

| # | Criticità | Dove | Rischio | Correzione | Priorità |
|---|---|---|---|---|---|
| D14 | **6 directory API vuote** | `audit-log/`, `documents/`, `gdpr/`, `reports/`, `scheduler/`, `training/` | Funzionalità dichiarate ma inesistenti — crea aspettativa non mantenuta | Implementare o rimuovere le directory placeholder | Media |
| D15 | **Rate limiting in-memory** | `_middleware.ts` riga 36 | Si resetta ad ogni cold start (~30 min idle). Inefficace contro attacchi | Migrare a Cloudflare KV o D1 per persistenza | Media |
| D16 | **Nessun test automatizzato** | Zero file test nel progetto | Regressioni non rilevabili, deploy rischiosi | Aggiungere almeno test API con vitest + supertest | Media |
| D17 | **Migration 006/007 non eseguibili** | Referenziano `mdl_protocol_templates` che non esiste | Confusione: file presenti ma inutilizzabili. Il sistema usa il pattern sentinel | Documentare che sono superseded, o rimuoverle | Media |
| D18 | **Nessun cambio mansione post-creazione** | Solo assegnazione al momento della creazione lavoratore | Lavoratore che cambia mansione resta con il protocollo precedente | Endpoint PATCH worker_jobs + UI | Media |
| D19 | **CRUD sedi operative mancante** | Schema esiste, nessuna API | Multi-sede non utilizzabile | Implementare API + tab frontend | Media |
| D20 | **CRUD figure sicurezza mancante** | Schema esiste, nessuna API | Obbligatorio per completezza anagrafica aziendale | Implementare API + tab frontend | Media |

---

<a name="sezione-e"></a>
## SEZIONE E — LISTA MODIFICHE CONSIGLIATE

| # | Modifica | File coinvolti | Effort | Impatto | Priorità |
|---|---|---|---|---|---|
| E1 | Rimuovere segreteria da `isClinical` in visit detail | `visits/[id]/index.ts` riga 21 | 0.5 gg | Conformità normativa | Urgente |
| E2 | Filtrare campi sensibili worker per DL/RSPP | `workers/[id]/index.ts` GET | 1 gg | Conformità GDPR | Urgente |
| E3 | Implementare forgot-password | Nuovo file `auth/forgot-password.ts` + frontend | 1 gg | Usabilità base | Urgente |
| E4 | Implementare auto-refresh token nel frontend | `mdl.js` (apiCall wrapper) | 1 gg | Sessione stabile | Urgente |
| E5 | Creare endpoint CRUD utenti (admin) | Nuovo file `users/index.ts`, `users/[id]/index.ts` | 4 gg | Operatività multi-utente | Urgente |
| E6 | Creare form anamnesi nel modal visita | `mdl.js` + `dashboard/index.html` | 5 gg | Conformità Allegato 3A | Urgente |
| E7 | Implementare raccolta consenso GDPR | Nuovo endpoint + form frontend | 3 gg | Conformità legale | Urgente |
| E8 | Creare portale lavoratore (MVP) | Nuova pagina HTML + JS + endpoint dedicati | 8 gg | Conformità + UX | Urgente |
| E9 | Implementare engine notifiche email | Worker scheduled + Resend API | 6 gg | Flusso operativo completo | Alta |
| E10 | Generazione PDF giudizio (server-side) | Nuovo endpoint con jsPDF/puppeteer | 3 gg | Professionalità | Alta |
| E11 | Generazione PDF cartella sanitaria | Nuovo endpoint | 5 gg | Conformità normativa | Alta |
| E12 | Implementare Allegato 3B | Query aggregata + export | 5 gg | Obbligo normativo MC | Alta |
| E13 | Implementare CRUD sedi operative | API + frontend | 2 gg | Completezza anagrafica | Media |
| E14 | Implementare CRUD figure sicurezza | API + frontend | 3 gg | Completezza anagrafica | Media |
| E15 | Implementare CRUD formazione | API + frontend | 4 gg | Tracciamento obblighi | Media |
| E16 | Agenda visiva (calendario) | Libreria calendar + integrazione | 5 gg | UX segreteria | Media |
| E17 | Export Excel liste | Libreria xlsx generation | 3 gg | Reportistica | Media |
| E18 | Import massivo lavoratori CSV | Endpoint + parser + validazione | 4 gg | Operatività | Media |
| E19 | Dashboard metriche admin | Endpoint aggregazione + UI | 3 gg | Monitoraggio | Media |
| E20 | Visualizzatore audit log | Endpoint GET + UI filtri | 2 gg | GDPR trasparenza | Media |
| E21 | Firma elettronica semplice | Pad firma + salvataggio immagine | 5 gg | Professionalità | Media |
| E22 | Portale azienda dedicato | Nuova pagina separata | 8 gg | UX azienda | Media |
| E23 | Migrare token a httpOnly cookie | Modifica middleware + frontend | 2 gg | Sicurezza | Media |
| E24 | Test automatizzati API | Setup vitest + test suite | 5 gg | Qualità codice | Media |
| E25 | GDPR export/cancellazione | Endpoint dedicati | 3 gg | Conformità GDPR | Media |

---

<a name="sezione-f"></a>
## SEZIONE F — ROADMAP DI SVILUPPO

### Fase 1 — INTERVENTI URGENTI (3-4 settimane, ~21 gg sviluppo)

> *Obiettivo: rendere la piattaforma legalmente utilizzabile e operativamente funzionante per il flusso base.*

| Settimana | Intervento | Effort | ID Modifica |
|---|---|---|---|
| 1 | Fix segreteria vede clinici + DL vede sensibili | 1.5 gg | E1, E2 |
| 1 | Forgot-password + auto-refresh token | 2 gg | E3, E4 |
| 1 | Endpoint CRUD utenti (admin) | 1.5 gg | E5 (parte 1) |
| 2 | UI gestione utenti + invito | 2.5 gg | E5 (parte 2) |
| 2 | Form anamnesi strutturato | 2.5 gg | E6 (parte 1) |
| 3 | Completamento form anamnesi + test | 2.5 gg | E6 (parte 2) |
| 3 | Raccolta consenso GDPR | 3 gg | E7 |
| 4 | Portale lavoratore (MVP) | 5 gg | E8 (parte 1) |

**Risultato Fase 1**: piattaforma utilizzabile con: multi-utente, accessi corretti, anamnesi, consenso, portale lavoratore base.

### Fase 2 — INTERVENTI IMPORTANTI (4-5 settimane, ~32 gg sviluppo)

> *Obiettivo: completare il flusso operativo end-to-end con documenti e comunicazioni.*

| Settimana | Intervento | Effort | ID Modifica |
|---|---|---|---|
| 5 | Portale lavoratore (completamento) | 3 gg | E8 (parte 2) |
| 5 | Engine notifiche email (Resend) | 2 gg | E9 (parte 1) |
| 6 | Completamento notifiche + convocazioni | 4 gg | E9 (parte 2) |
| 6 | PDF giudizio idoneità server-side | 3 gg | E10 |
| 7 | PDF cartella sanitaria (Allegato 3A) | 5 gg | E11 |
| 8 | Report Allegato 3B | 5 gg | E12 |
| 8-9 | CRUD sedi + figure sicurezza | 5 gg | E13, E14 |
| 9 | CRUD formazione | 4 gg | E15 |
| 9 | Auto-refresh token + sicurezza cookie | 1 gg | E23 |

**Risultato Fase 2**: flusso completo dalla creazione azienda alla consegna documenti, con notifiche email e reportistica normativa.

### Fase 3 — INTERVENTI EVOLUTIVI (3-4 settimane, ~25 gg sviluppo)

> *Obiettivo: migliorare produttività, UX e strumenti di gestione.*

| Intervento | Effort | ID Modifica |
|---|---|---|
| Agenda visiva (calendario) | 5 gg | E16 |
| Export Excel (liste lavoratori, scadenze, visite) | 3 gg | E17 |
| Import massivo lavoratori CSV | 4 gg | E18 |
| Dashboard admin con metriche | 3 gg | E19 |
| Visualizzatore audit log | 2 gg | E20 |
| Firma elettronica semplice | 5 gg | E21 |
| Test automatizzati API | 5 gg | E24 |
| GDPR export/cancellazione | 3 gg | E25 |

**Risultato Fase 3**: piattaforma professionale con strumenti avanzati di gestione, reportistica, sicurezza e conformità GDPR completa.

### Fase 4 — FUNZIONI FUTURE (timeline aperta)

> *Obiettivo: differenziazione competitiva e scalabilità.*

| Funzione | Effort stimato |
|---|---|
| Portale azienda dedicato (E22) | 8 gg |
| Integrazione laboratorio (HL7/FHIR) | 15 gg |
| Gestione fatturazione/consuntivi | 8 gg |
| App mobile lavoratore (PWA) | 20 gg |
| Sopralluogo aziendale con checklist | 5 gg |
| Telemedicina / visite remote | 10 gg |
| Integrazione PEC | 5 gg |
| Multi-tenant / multi-clinica | 15 gg |

---

<a name="sezione-g"></a>
## SEZIONE G — GIUDIZIO COMPLESSIVO

### Punteggio: 5.5 / 10

| Area | Punteggio | Note |
|---|---|---|
| Architettura | 7.5/10 | Stack moderno, serverless, ben strutturato |
| Schema DB | 8/10 | Completo, ben normalizzato, RLS ovunque |
| API Backend | 7/10 | Buona qualità codice, audit pervasivo, validazione input |
| Frontend | 5/10 | Funzionale ma basico, no framework, no responsive avanzato |
| Sicurezza | 5.5/10 | Buone basi (RLS, separazione clinica) ma lacune importanti |
| Conformità normativa | 4/10 | Predisposto ma largamente incompleto (GDPR, Allegati) |
| Completezza funzionale | 4/10 | ~50% del flusso MVP implementato |
| UX | 4.5/10 | Usabile per admin/segreteria, inaccessibile per lavoratore/azienda |
| Test/QA | 1/10 | Zero test, zero CI/CD |
| Documentazione | 3/10 | Solo commenti nel codice, no README operativo, no guida utente |

### Raccomandazione

**✅ CONTINUARE SULL'ATTUALE STRUTTURA CON CORREZIONI SIGNIFICATIVE**

Motivazione:
1. **L'architettura è solida**: Cloudflare Pages + Supabase è una scelta appropriata per questo tipo di applicazione. Lo schema DB è ben progettato e copre tutti i casi d'uso della MDL.

2. **Il codice è di buona qualità**: stile consistente, naming chiaro, pattern condivisi tra endpoint, audit logging pervasivo. Non serve riscrittura.

3. **La base è estendibile**: i 20 endpoint API seguono tutti lo stesso pattern (middleware → auth → role check → query → audit), rendendo facile aggiungere nuove funzionalità.

4. **NON conviene riscrivere** perché:
   - Il 90% del codice esistente è corretto e funzionante
   - Lo schema DB non ha difetti strutturali
   - Le criticità sono di completezza, non di architettura
   - Il pattern sentinel per i template è creativo e funziona

5. **Serve investimento significativo** per portare la piattaforma da "prototipo funzionante" a "prodotto professionale utilizzabile in contesto sanitario":
   - **Fase 1 (urgente)**: ~21 gg per renderla legalmente utilizzabile
   - **Fase 2 (importante)**: ~32 gg per il flusso end-to-end completo
   - **Totale MVP completo**: ~53 giorni di sviluppo
   - **Con funzioni evolutive**: ~78 giorni totali

---

<a name="sezione-h"></a>
## SEZIONE H — PROPOSTA STRUTTURA IDEALE DELLA PIATTAFORMA

### H.1 — Moduli Principali

| # | Modulo | Descrizione | Stato attuale |
|---|---|---|---|
| 1 | **Autenticazione & Utenti** | Login, registrazione, MFA, profili, ruoli | 30% |
| 2 | **Anagrafica Aziende** | CRUD aziende, sedi, figure sicurezza, contratti | 60% |
| 3 | **Anagrafica Lavoratori** | CRUD lavoratori, mansioni, storico, import | 50% |
| 4 | **Protocolli Sanitari** | Template, clonazione, personalizzazione esami | 85% |
| 5 | **Visite Mediche** | Programmazione, anamnesi, esame obiettivo, esami | 45% |
| 6 | **Giudizi di Idoneità** | Emissione, firma, notifica, ricorso, storico | 50% |
| 7 | **Gestione Documentale** | Upload/download, categorizzazione, scadenze | 60% |
| 8 | **Scadenzario & Agenda** | Aggregazione scadenze, calendario, promemoria | 40% |
| 9 | **Notifiche & Comunicazioni** | Email, in-app, convocazioni, promemoria | 5% |
| 10 | **Formazione** | Corsi, attestati, scadenze, aggiornamenti | 10% |
| 11 | **Reportistica** | Allegato 3B, statistiche, export PDF/Excel | 0% |
| 12 | **GDPR & Compliance** | Consensi, export dati, cancellazione, audit | 10% |
| 13 | **Fatturazione** | Consuntivi per azienda, export | 0% |
| 14 | **Dashboard Clinica** | KPI, volumi, scadenze, statistiche | 30% |
| 15 | **Portale Azienda** | Self-service DL/RSPP | 5% |
| 16 | **Portale Lavoratore** | Dati personali, giudizi, visite, consensi | 0% |
| 17 | **Amministrazione Sistema** | Gestione utenti, log, configurazione | 5% |
| 18 | **Audit & Sicurezza** | Log accessi, monitoraggio, alert | 30% |
| 19 | **Integrazione Esterna** | Laboratorio, PEC, calendario esterno | 0% |

### H.2 — Ruoli Utente (9 ruoli proposti)

| Ruolo | Codice | Accesso | Note |
|---|---|---|---|
| Super Admin | `super_admin` | Tutto | Gestione sistema completa |
| Medico Competente | `medico_competente` | Clinico completo | Unico con accesso cartella sanitaria |
| Medico Collaboratore | `medico_collaboratore` | Clinico (sotto supervisione MC) | Può compilare ma non firmare |
| Segreteria MDL | `segreteria_mdl` | Organizzativo (NO clinico) | Gestione appuntamenti, documenti, comunicazioni |
| Infermiere/Tecnico | `infermiere` | ⭐ NUOVO | Esecuzione esami, misurazioni, upload referti |
| Datore di Lavoro | `datore_lavoro` | Solo propria azienda (no clinici) | Dashboard aziendale, scadenze, giudizi |
| RSPP | `rspp` | Solo propria azienda (no clinici) | Come DL ma senza upload documenti |
| Consulente | `consulente` | ⭐ NUOVO | Lettura cross-aziendale, report, no modifica |
| Lavoratore | `lavoratore` | Solo propri dati | Portale personale, consensi, download giudizi |

### H.3 — Menu e Sezioni per Ruolo

#### Super Admin / Medico Competente
```
📊 Dashboard (KPI, alert, visite odierne)
🏢 Aziende (lista, dettaglio, 7 tab)
👥 Lavoratori (lista globale, ricerca)
📋 Visite (lista, filtri, dettaglio clinico)
📅 Agenda (calendario settimanale/mensile)
⏰ Scadenzario (tutte le scadenze, filtri)
📑 Protocolli (template + aziendali)
📊 Report (Allegato 3B, statistiche)
🔐 GDPR (consensi, export, cancellazione)
⚙️ Impostazioni (utenti, sistema, profilo)
📜 Audit Log (visualizzatore log)
```

#### Segreteria MDL
```
📊 Dashboard (appuntamenti oggi, alert scadenze)
🏢 Aziende (lista, dettaglio, tab organizzativi)
👥 Lavoratori (lista, ricerca, anagrafica NO clinica)
📋 Visite (programmazione, stati, convocazioni)
📅 Agenda (calendario)
⏰ Scadenzario
📄 Documenti (upload, gestione)
📤 Comunicazioni (convocazioni, promemoria)
```

#### Datore di Lavoro / RSPP
```
📊 Dashboard Aziendale (scadenze, copertura, alert)
👥 I Miei Lavoratori (lista, stato visite, mansioni)
📋 Visite in Corso (stato, programmate, completate)
⏰ Scadenze (visite, formazione, documenti)
📄 Documenti (DVR, nomine, download)
📊 Report (copertura visite, export)
```

#### Lavoratore
```
👤 Il Mio Profilo (dati anagrafici)
📋 Le Mie Visite (storico, prossime)
📑 I Miei Giudizi (download PDF)
🎓 La Mia Formazione (attestati)
🔐 Privacy (consensi, richieste)
```

### H.4 — Flusso Operativo Completo (7 fasi)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUSSO OPERATIVO MDL COMPLETO                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  FASE 1: ONBOARDING AZIENDA                                       │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Crea     │→ │ Inserisci │→ │ Definisci    │→ │ Carica DVR + │  │
│  │ Azienda  │  │ Sedi      │  │ Figure sic.  │  │ Nomina MC    │  │
│  └──────────┘  └───────────┘  └──────────────┘  └──────────────┘  │
│                                                                     │
│  FASE 2: CONFIGURAZIONE SANITARIA                                  │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Crea     │→ │ Assegna   │→ │ Seleziona    │→ │ Personalizza │  │
│  │ Mansioni │  │ Rischi    │  │ Template     │  │ Protocollo   │  │
│  └──────────┘  └───────────┘  └──────────────┘  └──────────────┘  │
│                                                                     │
│  FASE 3: GESTIONE LAVORATORI                                      │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Inserisci│→ │ Assegna   │→ │ Raccogli     │→ │ Genera       │  │
│  │ Lavorat. │  │ Mansione  │  │ Consenso GDPR│  │ Scadenze     │  │
│  └──────────┘  └───────────┘  └──────────────┘  └──────────────┘  │
│                                                                     │
│  FASE 4: CONVOCAZIONE E PROGRAMMAZIONE                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Verifica │→ │ Genera    │→ │ Invia        │→ │ Conferma     │  │
│  │ Scadenze │  │ Convocaz. │  │ Notifica     │  │ Appuntamento │  │
│  └──────────┘  └───────────┘  └──────────────┘  └──────────────┘  │
│                                                                     │
│  FASE 5: VISITA MEDICA                                             │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Check-in │→ │ Anamnesi  │→ │ Esame        │→ │ Accertamenti │  │
│  │ Lavorat. │  │ Completa  │  │ Obiettivo    │  │ Strumentali  │  │
│  └──────────┘  └───────────┘  └──────────────┘  └──────────────┘  │
│                                                                     │
│  FASE 6: GIUDIZIO E DOCUMENTAZIONE                                │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Upload   │→ │ Emetti    │→ │ Firma        │→ │ Genera PDF   │  │
│  │ Referti  │  │ Giudizio  │  │ Digitale     │  │ Certificato  │  │
│  └──────────┘  └───────────┘  └──────────────┘  └──────────────┘  │
│                                                                     │
│  FASE 7: CONSEGNA E ARCHIVIAZIONE                                 │
│  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Notifica │→ │ Notifica  │→ │ Pubblica su  │→ │ Aggiorna     │  │
│  │ al DL    │  │ al Lavora.│  │ Portale      │  │ Scadenze     │  │
│  └──────────┘  └───────────┘  └──────────────┘  └──────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### H.5 — Entità Database (esistenti + proposte)

#### 17 Tabelle esistenti (tutte valide, da mantenere)
Tutte le tabelle della migration 001 sono ben progettate e non richiedono modifiche strutturali.

#### 6 Tabelle proposte (nuove)

| Tabella | Scopo | Campi chiave |
|---|---|---|
| `mdl_convocations` | Lettere di convocazione generate | worker_id, visit_id, template, sent_at, channel |
| `mdl_anamnesis_templates` | Template sezioni anamnesi predefinite | name, category, questions JSONB |
| `mdl_system_config` | Configurazione globale sistema | key, value, category |
| `mdl_user_invitations` | Inviti utente in attesa | email, role, company_id, token, expires_at |
| `mdl_billing_items` | Consuntivi prestazioni | company_id, visit_id, exam_code, amount, date |
| `mdl_report_cache` | Cache report generati (Allegato 3B, ecc.) | report_type, year, company_id, data JSONB, pdf_path |

### H.6 — Documenti Generabili

| # | Documento | Formato | Chi genera | Chi riceve |
|---|---|---|---|---|
| 1 | Giudizio di idoneità | PDF | MC | Lavoratore + DL |
| 2 | Cartella sanitaria (Allegato 3A) | PDF | MC | Lavoratore (alla cessazione) |
| 3 | Allegato 3B (dati aggregati) | PDF/XLS | MC | INAIL/ASL |
| 4 | Lettera di convocazione | PDF/Email | Segreteria | Lavoratore |
| 5 | Elenco scadenze azienda | PDF/XLS | Sistema | DL/RSPP |
| 6 | Report visite effettuate | PDF/XLS | Sistema | DL/MC |
| 7 | Piano sanitario aziendale | PDF | MC | DL |
| 8 | Verbale sopralluogo | PDF | MC | DL |
| 9 | Export dati personali (GDPR) | JSON/PDF | Sistema | Lavoratore |
| 10 | Consuntivo prestazioni | PDF/XLS | Sistema | Amministrazione |

### H.7 — Notifiche Automatiche

| # | Evento trigger | Destinatario | Canale | Timing |
|---|---|---|---|---|
| 1 | Visita in scadenza | Segreteria | In-app | 60/30/15 giorni prima |
| 2 | Convocazione visita | Lavoratore | Email + SMS | Al momento della convocazione |
| 3 | Promemoria visita | Lavoratore | Email + SMS | 3 giorni + 1 giorno prima |
| 4 | Giudizio emesso | Lavoratore | Email | Immediato |
| 5 | Giudizio emesso (copia) | DL | Email | Immediato (senza motivazione clinica) |
| 6 | Documento in scadenza | Segreteria + DL | In-app + Email | 60/30/15 giorni prima |
| 7 | Formazione in scadenza | Segreteria + DL | In-app + Email | 90/60/30 giorni prima |
| 8 | Lavoratore non presentato | Segreteria | In-app | Immediato |
| 9 | Nuovo utente invitato | Nuovo utente | Email | Immediato |
| 10 | Deadline ricorso in avvicinamento | MC | In-app | 15/7 giorni prima |

### H.8 — Report per Ruolo

#### Per il Medico Competente
- Allegato 3B (dati sanitari aggregati annuali)
- Statistiche giudizi (idonei, non idonei, con limitazioni) per periodo
- Elenco lavoratori con esposizioni a rischio specifico
- Copertura visite per azienda/mansione
- Scadenze prossime visite

#### Per l'Azienda (DL/RSPP)
- Stato copertura visite (% lavoratori in regola)
- Elenco scadenze prossime
- Riepilogo giudizi (senza dati clinici)
- Stato formazione lavoratori
- Storico documenti aziendali

#### Per la Segreteria
- Volumi visite settimanali/mensili
- Lavoratori da convocare
- Documenti in scadenza
- Statistiche no-show
- Agenda settimanale/mensile

### H.9 — Funzioni MVP (primo rilascio)

| # | Funzione | Stato attuale | Effort rimanente |
|---|---|---|---|
| 1 | Login + gestione sessione | ✅ 80% | 1 gg (refresh) |
| 2 | CRUD Utenti | ❌ 0% | 4 gg |
| 3 | Forgot password | ❌ 0% | 1 gg |
| 4 | CRUD Aziende | ✅ 90% | 0.5 gg |
| 5 | CRUD Lavoratori | ✅ 75% | 2 gg |
| 6 | CRUD Mansioni | ✅ 85% | 0.5 gg |
| 7 | Protocolli (template + clone) | ✅ 85% | 0.5 gg |
| 8 | Programmazione visite | ✅ 75% | 1 gg |
| 9 | Form anamnesi | ❌ 0% (campi DB ok) | 5 gg |
| 10 | Giudizio idoneità | ✅ 85% | 1 gg |
| 11 | Upload/download referti | ✅ 80% | 0.5 gg |
| 12 | Documenti aziendali | ✅ 85% | 0.5 gg |
| 13 | Scadenzario | ✅ 80% | 1 gg |
| 14 | PDF giudizio | ⚠️ 30% (HTML print) | 3 gg |
| 15 | Portale lavoratore base | ❌ 0% | 8 gg |
| 16 | Consenso GDPR | ❌ 0% (schema ok) | 3 gg |
| 17 | Notifiche email base | ❌ 0% | 4 gg |
| 18 | Separazione dati clinici | ⚠️ 75% (bug segreteria) | 1 gg |
| 19 | Audit log completo | ⚠️ 70% | 2 gg |
| 20 | Allegato 3B base | ❌ 0% | 5 gg |
| | **TOTALE EFFORT RIMANENTE MVP** | | **~44 gg** |

### H.10 — Funzioni Avanzate (seconda fase)

| # | Funzione | Effort |
|---|---|---|
| 1 | Agenda visiva con calendario | 5 gg |
| 2 | Portale azienda dedicato | 8 gg |
| 3 | Export Excel/CSV | 3 gg |
| 4 | Import massivo lavoratori | 4 gg |
| 5 | Firma elettronica semplice | 5 gg |
| 6 | Report avanzati per MC | 4 gg |
| 7 | Dashboard admin con metriche | 3 gg |
| 8 | Visualizzatore audit log | 2 gg |
| 9 | CRUD sedi operative | 2 gg |
| 10 | CRUD figure sicurezza | 3 gg |
| 11 | CRUD formazione | 4 gg |
| 12 | GDPR export/cancellazione | 3 gg |
| 13 | Test automatizzati API | 5 gg |
| 14 | Sicurezza avanzata (httpOnly, CSP) | 2 gg |
| 15 | Convocazioni automatiche | 4 gg |

---

## CONCLUSIONE

La piattaforma MDL di Bio-Clinic ha **fondamenta architetturali solide** ma è attualmente un **prototipo funzionale** che copre circa il 50% delle funzionalità necessarie per un utilizzo professionale in contesto sanitario.

**5 interventi urgenti** (lavoratore, GDPR, registrazione, password, anamnesi) devono essere implementati prima di qualsiasi rilascio in produzione.

**La raccomandazione è di continuare sullo stack attuale** (Cloudflare Pages + Supabase), correggendo le criticità di sicurezza/conformità e completando il flusso operativo secondo la roadmap proposta.

**Effort totale stimato per MVP completo**: ~44 giorni di sviluppo  
**Effort totale con funzioni evolutive**: ~97 giorni di sviluppo

---

*Fine audit — documento generato il 2026-06-10*

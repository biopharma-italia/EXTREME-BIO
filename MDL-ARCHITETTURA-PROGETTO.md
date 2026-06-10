# MEDICINA DEL LAVORO — Documento di Architettura e Analisi Progettuale

## Autore: Solution Architect AI | Data: 2026-06-08
## Dominio target: `mdl.bio-clinic.it`
## Progetto Cloudflare Pages: `mdl-bioclinic`

---

## 1. DISCOVERY — CONTESTO SISTEMA ESISTENTE

### 1.1 Stack Tecnologico Corrente (referti.bio-clinic.it)

| Componente | Tecnologia | Note |
|---|---|---|
| **Hosting** | Cloudflare Pages | Edge deploy, Functions per backend |
| **Backend** | Cloudflare Workers (TypeScript) | File-based routing in `functions/api/` |
| **Frontend** | Vanilla JS + HTML statico | SPA-like con hash routing (`#section`) |
| **Database** | Supabase PostgreSQL | RLS policies, UUID primary keys |
| **Auth** | Supabase Auth + custom JWT | 2FA TOTP, session management |
| **Storage** | Supabase Storage (bucket `referti`) | AES-256-GCM encryption at-rest |
| **Email** | Resend API | Transactional emails |
| **AI** | GenSpark LLM Proxy (gpt-5) | Report generation |
| **PDF** | pdf-lib (client-side) + pdf.js | Generation + extraction |
| **CDN/Security** | Cloudflare (WAF, CSP, HSTS) | Strict CSP policy |

### 1.2 Moduli Esistenti

1. **Autenticazione**: Login, 2FA TOTP, password reset, session management
2. **Gestione Utenti**: CRUD utenti, ruoli (patient, lab_technician, physician, ostetrica, admin, super_admin)
3. **Gestione Referti**: Upload, validazione 4-step, firma, rilascio, revoca
4. **Storage Criptato**: Upload/download files con AES-256-GCM
5. **Notifiche**: Email + in-app, multi-channel ready
6. **GDPR**: Consensi, data export, data request, audit log
7. **Refertazione AI**: MOC-DXA parsing, AI generation, PDF output
8. **Audit Trail**: Log inalterabile, partitioned by date

### 1.3 Pattern Architetturali Esistenti

- **File-based API routing** (`functions/api/[resource]/[action].ts`)
- **Middleware chain** (auth, rate-limit, CORS, request context)
- **Supabase Admin Client** per operazioni privilegiate server-side
- **Supabase Anon Client** per operazioni client-side (RLS-gated)
- **Event-driven notifications** (report lifecycle triggers)
- **Cache busting** con content hash per static assets
- **CSP-first** security model (no external CDN scripts)

---

## 2. DECISIONE ARCHITETTURALE: DOMINIO SEPARATO

### 2.1 ADR-001: Separazione su `mdl.bio-clinic.it`

**Contesto**: La Medicina del Lavoro gestisce dati sanitari di natura diversa (cartelle sanitarie di rischio, giudizi di idoneita) rispetto ai referti di laboratorio. I soggetti coinvolti sono diversi (aziende, lavoratori, RSPP) e la normativa di riferimento e specifica (D.Lgs. 81/2008).

**Decisione**: Deploy su dominio separato `mdl.bio-clinic.it` con progetto Cloudflare Pages dedicato `mdl-bioclinic`.

**Motivazioni**:
1. **Separazione del traffico**: Isolamento completo a livello DNS/CDN
2. **Security boundary**: CSP, CORS, cookie scope isolati
3. **Compliance GDPR**: Titolari/responsabili diversi per i due trattamenti
4. **Scalabilita indipendente**: Risorse Cloudflare separate (limits, analytics)
5. **Deploy indipendente**: Rilasci senza rischio di regressione su referti
6. **Audit separato**: Log e monitoring dedicati
7. **DPIA distinta**: Valutazione d'impatto separata per il trattamento MDL

**Conseguenze**:
- Necessita di Supabase project separato (o schema separato con RLS rigoroso)
- Autenticazione: SSO condiviso o account separati (raccomandato: SSO con role-switch)
- Costi Cloudflare: progetto aggiuntivo (free tier e sufficiente per MVP)

### 2.2 ADR-002: Database Strategy

**Opzione A** — Supabase project separato (RACCOMANDATO):
- Isolamento completo dati sanitari MDL
- RLS indipendente
- Backup/restore indipendente
- Retention policies separate (10-40 anni per CSR)
- Nessun rischio di leak cross-dominio

**Opzione B** — Schema separato nello stesso project:
- Piu economico
- Condivisione anagrafica utenti
- Rischio: un bug RLS espone dati cross-dominio

**Decisione**: Opzione A con federazione utenti via lookup esterno.

### 2.3 ADR-003: Shared Authentication

**Strategia**: OAuth2/OpenID Connect con Bio-Clinic come Identity Provider:
- Il login avviene su `auth.bio-clinic.it` (o su ciascun dominio con JWT condiviso)
- JWT firmato con chiave condivisa contiene `sub`, `role`, `domains[]`
- Ogni dominio valida il JWT localmente e applica i propri permessi
- Cross-domain session tramite secure httpOnly cookie + token refresh

**Alternativa pragmatica per MVP**: Account separati con stessa email/password, sincronizzati tramite webhook su user creation/update.

---

## 3. ANALISI CRITICITA

### 3.1 Criticita Normative (RISCHIO ALTO)

| # | Criticita | Rischio | Mitigazione |
|---|---|---|---|
| N1 | Conservazione CSR 10-40 anni | Alto | Storage immutabile con retention lock, backup geo-ridondante |
| N2 | Trasmissione cartella alla cessazione MC | Alto | Export standardizzato XML/PDF, procedura automatizzata |
| N3 | Flusso INAIL art. 40 (scadenza annuale) | Alto | Generazione XML automatica, validazione pre-invio |
| N4 | Separazione dati sanitari/amministrativi | Alto | Schema DB separato, RLS per ruolo, audit ogni accesso |
| N5 | Allegato 3A conformita campi CSR | Alto | Modello dati mappato 1:1 su allegato normativo |
| N6 | Ricorso lavoratore (30gg da giudizio) | Medio | Tracking date, alert automatici, storicizzazione |

### 3.2 Criticita Sicurezza e Privacy (RISCHIO ALTO)

| # | Criticita | Rischio | Mitigazione |
|---|---|---|---|
| S1 | Dati sanitari art. 9 GDPR | Alto | Cifratura campo-per-campo, pseudonimizzazione report aggregati |
| S2 | Audit log inalterabile | Alto | Append-only table, partitioned, no DELETE policy |
| S3 | DPIA obbligatoria | Alto | Redazione prima del go-live, revisione annuale |
| S4 | Data breach notification 72h | Alto | Incident response plan, monitoring anomalie |
| S5 | Accesso MC vs DL (info asimmetrica) | Alto | RBAC granulare: DL vede solo giudizio, non cartella |
| S6 | Multi-tenancy sicura | Alto | Tenant isolation a livello DB row (company_id FK) |

### 3.3 Criticita Tecniche (RISCHIO MEDIO)

| # | Criticita | Rischio | Mitigazione |
|---|---|---|---|
| T1 | Performance ricerca su milioni di CSR | Medio | Indici compositi, paginazione, full-text search |
| T2 | Firma digitale integrazione | Medio | API InfoCert/Aruba, firma remota, PAdES |
| T3 | Migrazione dati legacy (Excel) | Medio | Parser CSV/XLS, validazione, import assistito |
| T4 | Gestione documenti pesanti (DVR 50MB+) | Medio | Presigned URLs, chunked upload, CDN cache |
| T5 | Offline mode per sopralluoghi | Medio | Service Worker + IndexedDB, sync on reconnect |
| T6 | Multi-sede con protocolli diversi | Medio | Struttura gerarchica: azienda > sede > mansione > protocollo |

### 3.4 Criticita Organizzative (RISCHIO MEDIO)

| # | Criticita | Rischio | Mitigazione |
|---|---|---|---|
| O1 | Workflow complessi multi-attore | Medio | State machine + event sourcing per tracciabilita |
| O2 | Aggiornamento protocolli nel tempo | Medio | Versionamento protocolli con data efficacia |
| O3 | Errore mansione = protocollo sbagliato | Medio | Validazione incrociata DVR-mansione-protocollo |
| O4 | Formazione utenti non tecnici | Basso | UX wizard-based, help contestuale, onboarding guidato |

---

## 4. ARCHITETTURA TECNICA PROPOSTA

### 4.1 Stack MDL

| Componente | Tecnologia | Motivazione |
|---|---|---|
| **Hosting** | Cloudflare Pages (`mdl-bioclinic`) | Coerenza con sistema esistente |
| **Backend** | Cloudflare Workers (TypeScript) | Stesso pattern referti, riuso middleware |
| **Frontend** | Vanilla JS + HTML (come referti) | Coerenza UX, no framework overhead |
| **Database** | Supabase PostgreSQL (progetto separato) | Isolamento dati sanitari |
| **Storage** | Supabase Storage + R2 (per documenti pesanti) | R2 per DVR/planimetrie grandi |
| **Auth** | Supabase Auth (progetto separato) + JWT condiviso | SSO futuro |
| **Email** | Resend API | Coerenza |
| **Firma digitale** | InfoCert/Aruba API (fase 2) | PAdES per giudizi |
| **Scadenzario** | Cloudflare Cron Triggers + Queues | Alert automatici |
| **PDF** | pdf-lib (client) + server-side generation | Giudizi, cartelle, report |

### 4.2 Struttura Progetto

```
mdl-bioclinic/
├── public/
│   ├── index.html                    # Landing/login
│   ├── dashboard/
│   │   └── index.html                # Dashboard principale (hash routing)
│   ├── portale-azienda/
│   │   └── index.html                # Portale dedicato aziende clienti
│   ├── portale-lavoratore/
│   │   └── index.html                # Portale self-service lavoratore
│   ├── css/
│   ├── js/
│   └── images/
├── functions/
│   └── api/
│       ├── _middleware.ts            # Auth, rate-limit, CORS, tenant context
│       ├── auth/                     # Login, register, 2FA, password
│       ├── companies/                # CRUD aziende clienti
│       │   ├── index.ts
│       │   ├── [id].ts
│       │   ├── [id]/sites.ts         # Sedi operative
│       │   ├── [id]/contacts.ts      # Figure sicurezza
│       │   └── [id]/contracts.ts     # Contratti sorveglianza
│       ├── workers/                  # CRUD lavoratori
│       │   ├── index.ts
│       │   ├── [id].ts
│       │   ├── [id]/health-record.ts # Cartella sanitaria
│       │   ├── [id]/fitness.ts       # Giudizi idoneita
│       │   ├── [id]/training.ts      # Formazione
│       │   └── [id]/history.ts       # Storico mansioni
│       ├── protocols/                # Protocolli sanitari
│       │   ├── index.ts
│       │   └── [id].ts
│       ├── visits/                   # Visite mediche
│       │   ├── index.ts
│       │   ├── [id].ts
│       │   ├── [id]/exams.ts         # Accertamenti
│       │   ├── [id]/fitness-judgment.ts
│       │   └── schedule.ts           # Pianificazione
│       ├── documents/                # Repository documentale
│       │   ├── index.ts
│       │   ├── [id].ts
│       │   └── upload.ts
│       ├── training/                 # Modulo formazione
│       │   ├── courses.ts
│       │   ├── certificates.ts
│       │   └── expiry.ts
│       ├── reports/                  # Reportistica
│       │   ├── annual-health.ts      # Relazione sanitaria annuale
│       │   ├── inail-art40.ts        # Flusso INAIL
│       │   └── statistics.ts
│       ├── scheduler/                # Scadenzario
│       │   ├── expiring.ts
│       │   └── notifications.ts
│       ├── audit-log/
│       ├── gdpr/
│       └── admin/
├── src/
│   └── lib/
│       ├── types.ts
│       ├── constants.ts
│       ├── supabase.ts
│       ├── encryption.ts
│       ├── email-templates.ts
│       ├── fitness-judgment.ts       # Business logic giudizi
│       ├── protocol-engine.ts        # Calcolo protocollo da mansione
│       ├── inail-xml.ts              # Generazione XML art. 40
│       └── validators.ts
├── supabase/
│   └── migrations/
│       ├── 001_mdl_schema.sql
│       ├── 002_mdl_rls.sql
│       ├── 003_mdl_triggers.sql
│       └── 004_mdl_seed.sql
├── wrangler.toml
├── package.json
└── tsconfig.json
```

### 4.3 Modello Dati Concettuale (Entita Principali)

```
┌─────────────────┐     1:N     ┌─────────────────┐
│    COMPANIES    │─────────────│   COMPANY_SITES  │
│ (Aziende)      │             │ (Sedi operative) │
└────────┬────────┘             └─────────────────┘
         │ 1:N
         ▼
┌─────────────────┐     N:1     ┌─────────────────┐
│COMPANY_CONTACTS │─────────────│  SAFETY_ROLES   │
│(Figure sicur.)  │             │ (DL,RSPP,RLS..) │
└─────────────────┘             └─────────────────┘
         │
         │ (MC = medico competente)
         ▼
┌─────────────────┐     1:N     ┌─────────────────┐
│    WORKERS      │─────────────│  WORKER_JOBS    │
│ (Lavoratori)    │             │(Mansioni storico)│
└────────┬────────┘             └────────┬────────┘
         │ 1:1                           │ N:1
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│ HEALTH_RECORDS  │             │    JOB_ROLES    │
│(Cartella sanit.)│             │   (Mansioni)    │
└────────┬────────┘             └────────┬────────┘
         │ 1:N                           │ 1:1
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│    VISITS       │             │   PROTOCOLS     │
│(Visite mediche) │             │(Protocolli san.)│
└────────┬────────┘             └────────┬────────┘
         │ 1:N                           │ 1:N
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│ VISIT_EXAMS     │             │ PROTOCOL_EXAMS  │
│ (Accertamenti)  │             │(Esami previsti) │
└─────────────────┘             └─────────────────┘
         │
         ▼
┌─────────────────┐
│FITNESS_JUDGMENTS│
│(Giudizi idoneit)│
└─────────────────┘
```

**Entita aggiuntive**:
- `DOCUMENTS` (repository documentale aziendale)
- `TRAINING_RECORDS` (attestati formazione)
- `CONTRACTS` (contratti sorveglianza sanitaria)
- `NOTIFICATIONS` (scadenze, alert)
- `AUDIT_LOG` (tracciamento accessi)
- `GDPR_CONSENTS` (consensi specifici MDL)

### 4.4 Sistema Ruoli (RBAC)

| Ruolo | Accesso |
|---|---|
| `medico_competente` | TUTTO: cartelle, giudizi, visite, documenti, report |
| `medico_collaboratore` | Come MC ma solo per le aziende assegnate |
| `segreteria_mdl` | Anagrafiche, appuntamenti, fatturazione. NO dati sanitari |
| `datore_lavoro` | Solo giudizi (senza motivazione clinica), scadenze, documenti aziendali |
| `rspp` | Documenti aziendali, scadenze formazione. NO dati sanitari |
| `lavoratore` | Proprio fascicolo: giudizi, attestati, prossime visite |
| `super_admin` | Configurazione sistema, gestione utenti, audit |

### 4.5 Workflow Principale: Visita Periodica

```
[SCADENZARIO]
     │ T-90gg: alert interno
     │ T-60gg: notifica azienda
     │ T-30gg: convocazione lavoratore
     ▼
[PIANIFICAZIONE]
     │ Segreteria fissa data/ora
     │ Notifica lavoratore (email/SMS)
     │ Promemoria T-48h
     ▼
[ACCETTAZIONE]
     │ Check-in lavoratore
     │ Verifica documenti (tessera sanitaria, moduli compilati)
     │ Raccolta consenso se primo accesso
     ▼
[VISITA MEDICA]
     │ MC compila: anamnesi, EO, esami integrativi
     │ Valuta referti accertamenti
     │ Aggiorna cartella sanitaria
     ▼
[GIUDIZIO IDONEITA]
     │ MC emette giudizio (idoneo/prescrizioni/limitazioni/non idoneo)
     │ Firma digitale
     │ Genera PDF giudizio
     ▼
[NOTIFICA]
     │ Copia al lavoratore (consegna diretta o email)
     │ Copia al datore di lavoro (solo giudizio, NO dettagli clinici)
     │ Aggiornamento scadenzario
     ▼
[ARCHIVIAZIONE]
     │ CSR aggiornata e cifrata
     │ Audit log
     │ Calcolo prossima scadenza
```

---

## 5. PIANO MULTI-AGENTE

### 5.1 Agenti e Responsabilita

| Agente | Ruolo | Deliverable Principale |
|---|---|---|
| **AGENT-1: Compliance** | Garante normativo | DPIA, checklist D.Lgs.81/2008, policy retention |
| **AGENT-2: Architect** | Architettura tecnica | Schema DB, API design, ADR |
| **AGENT-3: Security** | Sicurezza e cifratura | Threat model, encryption strategy, IAM |
| **AGENT-4: Backend** | Implementazione server | Workers TS, business logic, integrazioni |
| **AGENT-5: Frontend** | Implementazione UI | Dashboard, portali, PDF generation |
| **AGENT-6: DevOps** | Deploy e infrastruttura | Wrangler config, CI/CD, monitoring |

### 5.2 Matrice RACI (Deliverable x Agente)

| Deliverable | Compliance | Architect | Security | Backend | Frontend | DevOps |
|---|---|---|---|---|---|---|
| Schema DB | C | A/R | C | I | I | I |
| API Endpoints | I | A | C | R | C | I |
| RLS Policies | C | C | A/R | I | I | I |
| Frontend UI | I | C | I | C | A/R | I |
| Encryption | C | C | A/R | R | I | I |
| DPIA | A/R | C | C | I | I | I |
| Wrangler/Deploy | I | C | I | I | I | A/R |
| Audit System | C | A | C | R | I | I |
| PDF Generation | I | C | I | C | A/R | I |
| INAIL XML | A/C | C | I | R | I | I |

*R=Responsible, A=Accountable, C=Consulted, I=Informed*

### 5.3 Workflow di Coordinamento

```
FASE 0: AGENT-1 (Compliance) + AGENT-2 (Architect)
   └─> Producono: DPIA bozza + Schema DB + ADR
   └─> Gate: Validazione normativa OK

FASE 1: AGENT-3 (Security) + AGENT-2 (Architect)
   └─> Producono: Encryption strategy + RLS + IAM model
   └─> Gate: Security review passed

FASE 2: AGENT-4 (Backend) + AGENT-5 (Frontend) [PARALLELO]
   └─> Backend: API endpoints, business logic
   └─> Frontend: Dashboard UI, forms, PDF
   └─> Sync: API contract (OpenAPI spec)

FASE 3: AGENT-6 (DevOps) + AGENT-4 + AGENT-5
   └─> Deploy pipeline, secrets, domain setup
   └─> Gate: E2E test su staging

FASE 4: AGENT-1 (Compliance) review finale
   └─> Validazione conformita pre-go-live
```

---

## 6. ROADMAP IMPLEMENTATIVA

### Fase 0 — Setup e Preparazione (Settimana 1-2)

- [ ] Creare progetto Cloudflare Pages `mdl-bioclinic`
- [ ] Creare progetto Supabase dedicato MDL
- [ ] Configurare dominio `mdl.bio-clinic.it`
- [ ] Setup struttura progetto (scaffold)
- [ ] Definire schema DB completo (migrations SQL)
- [ ] Configurare secrets (encryption key, Resend, etc.)
- [ ] Creare design system CSS (coerente con referti)
- [ ] DPIA bozza

### Fase 1 — MVP Core (Settimana 3-10)

**Sprint 1-2: Autenticazione + Anagrafica**
- [ ] Auth: login, register, 2FA, password reset
- [ ] CRUD Aziende (companies + sites + contacts)
- [ ] CRUD Lavoratori (workers + job assignments)
- [ ] Figure sicurezza (safety roles)
- [ ] Dashboard admin base

**Sprint 3-4: Sorveglianza Sanitaria**
- [ ] Protocolli sanitari (protocols + exam definitions)
- [ ] Motore calcolo protocollo da mansione/rischi
- [ ] Cartella sanitaria (health_records) — campi Allegato 3A
- [ ] Visita medica (visits + exams)
- [ ] Giudizio di idoneita con stati e storicizzazione

**Sprint 5: Scadenzario + Notifiche**
- [ ] Dashboard scadenze (30/60/90gg)
- [ ] Cron trigger per alert automatici
- [ ] Email notifiche a MC, azienda, lavoratore
- [ ] Calendario visite (pianificazione)

### Fase 2 — Documentale + Firma (Settimana 11-16)

- [ ] Repository documentale aziendale
- [ ] Upload/download con cifratura
- [ ] Versionamento documenti
- [ ] Generazione PDF giudizio idoneita
- [ ] Firma digitale (integrazione API)
- [ ] Portale azienda (vista limitata)
- [ ] Portale lavoratore (fascicolo personale)

### Fase 3 — Formazione + Reportistica (Settimana 17-22)

- [ ] Modulo formazione (corsi, attestati, scadenze)
- [ ] Relazione sanitaria annuale (aggregata, anonima)
- [ ] Generazione XML INAIL art. 40
- [ ] Statistiche e KPI dashboard
- [ ] Export dati (PDF, Excel)

### Fase 4 — Integrazioni Avanzate (Settimana 23-30)

- [ ] Integrazione SPID/CIE per accesso lavoratori
- [ ] PEC per comunicazioni ufficiali
- [ ] Sistema TS per fatturazione sanitaria
- [ ] App mobile (PWA) per lavoratori
- [ ] Modalita offline per sopralluoghi
- [ ] AI assistente (supporto decisionale, OCR cartelle storiche)

---

## 7. SCHEMA DATABASE (PREVIEW — Fase 0)

```sql
-- Enum types
CREATE TYPE worker_contract_type AS ENUM ('indeterminato', 'determinato', 'somministrato', 'apprendista', 'collaborazione');
CREATE TYPE visit_type AS ENUM ('preventiva', 'periodica', 'richiesta_lavoratore', 'cambio_mansione', 'cessazione', 'pre_ripresa', 'straordinaria');
CREATE TYPE fitness_judgment_type AS ENUM ('idoneo', 'idoneo_prescrizioni', 'idoneo_limitazioni_temp', 'idoneo_limitazioni_perm', 'non_idoneo_temp', 'non_idoneo_perm');
CREATE TYPE risk_level AS ENUM ('basso', 'medio', 'alto');
CREATE TYPE exam_periodicity AS ENUM ('semestrale', 'annuale', 'biennale', 'triennale', 'quinquennale', 'una_tantum');

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  vat_number VARCHAR(11) UNIQUE NOT NULL,
  fiscal_code VARCHAR(16),
  ateco_code VARCHAR(10),
  sector VARCHAR(100),
  risk_level risk_level NOT NULL DEFAULT 'basso',
  legal_address JSONB NOT NULL, -- {street, city, province, zip, region}
  pec_email CITEXT,
  phone VARCHAR(20),
  total_employees INTEGER DEFAULT 0,
  contract_type VARCHAR(50),
  contract_start DATE,
  contract_end DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company sites (multi-sede)
CREATE TABLE company_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  site_name VARCHAR(255) NOT NULL,
  address JSONB NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  employee_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety figures (figure della sicurezza)
CREATE TABLE safety_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  site_id UUID REFERENCES company_sites(id),
  role VARCHAR(50) NOT NULL, -- 'datore_lavoro', 'rspp', 'aspp', 'mc', 'rls', 'primo_soccorso', 'antincendio', 'preposto'
  full_name VARCHAR(200) NOT NULL,
  fiscal_code VARCHAR(16),
  email CITEXT,
  phone VARCHAR(20),
  appointment_date DATE,
  appointment_expiry DATE,
  is_external BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workers (lavoratori)
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- link to auth user (for portal access)
  company_id UUID NOT NULL REFERENCES companies(id),
  site_id UUID REFERENCES company_sites(id),
  fiscal_code VARCHAR(16) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  place_of_birth VARCHAR(100),
  gender VARCHAR(1) CHECK (gender IN ('M', 'F')),
  residence_address JSONB,
  phone VARCHAR(20),
  email CITEXT,
  language VARCHAR(5) DEFAULT 'it',
  id_document_type VARCHAR(30),
  id_document_number VARCHAR(50),
  id_document_expiry DATE,
  hire_date DATE,
  contract_type worker_contract_type,
  qualification VARCHAR(50), -- operaio, impiegato, dirigente
  work_schedule VARCHAR(50), -- giornaliero, turni, notturno
  is_pregnant BOOLEAN DEFAULT false,
  is_minor BOOLEAN DEFAULT false,
  is_disabled BOOLEAN DEFAULT false,
  is_night_worker BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  termination_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job roles (mansioni)
CREATE TABLE job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  role_name VARCHAR(200) NOT NULL,
  description TEXT,
  risk_factors TEXT[], -- ['rumore', 'vibrazioni', 'chimico', 'vdt', 'mmc', ...]
  risk_level risk_level NOT NULL DEFAULT 'basso',
  dvr_reference VARCHAR(100), -- riferimento al DVR
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker job assignments (storico mansioni)
CREATE TABLE worker_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  job_role_id UUID NOT NULL REFERENCES job_roles(id),
  site_id UUID REFERENCES company_sites(id),
  department VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health surveillance protocols
CREATE TABLE protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  job_role_id UUID NOT NULL REFERENCES job_roles(id),
  protocol_name VARCHAR(200) NOT NULL,
  version VARCHAR(10) DEFAULT '1.0',
  effective_date DATE NOT NULL,
  expiry_date DATE,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protocol exams (accertamenti previsti nel protocollo)
CREATE TABLE protocol_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  exam_type VARCHAR(100) NOT NULL, -- 'emocromo', 'audiometria', 'spirometria', 'visiotest', 'ecg', 'drug_test', ...
  exam_name VARCHAR(200) NOT NULL,
  periodicity exam_periodicity NOT NULL,
  is_mandatory BOOLEAN DEFAULT true,
  applicable_visit_types visit_type[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visits (visite mediche)
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id),
  visit_type visit_type NOT NULL,
  protocol_id UUID REFERENCES protocols(id),
  scheduled_date DATE,
  scheduled_time TIME,
  actual_date DATE,
  status VARCHAR(30) DEFAULT 'programmata', -- programmata, effettuata, non_presentato, annullata
  anamnesis_family TEXT,
  anamnesis_physiological TEXT,
  anamnesis_pathological_remote TEXT,
  anamnesis_pathological_recent TEXT,
  anamnesis_occupational TEXT,
  physical_examination TEXT,
  conclusions TEXT,
  physician_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visit exams (accertamenti effettuati)
CREATE TABLE visit_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  exam_type VARCHAR(100) NOT NULL,
  exam_name VARCHAR(200) NOT NULL,
  exam_date DATE,
  result TEXT,
  result_value DECIMAL,
  result_unit VARCHAR(30),
  is_normal BOOLEAN,
  reference_range VARCHAR(100),
  attachment_path TEXT, -- encrypted file path
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fitness judgments (giudizi di idoneita)
CREATE TABLE fitness_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES visits(id),
  worker_id UUID NOT NULL REFERENCES workers(id),
  judgment_type fitness_judgment_type NOT NULL,
  prescriptions TEXT, -- prescrizioni dettagliate
  limitations TEXT, -- limitazioni dettagliate
  limitations_expiry DATE, -- per limitazioni temporanee
  reevaluation_date DATE, -- data rivalutazione (per non idoneo temp)
  next_visit_date DATE, -- calcolata dal protocollo
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  signed_at TIMESTAMPTZ,
  signature_hash VARCHAR(128),
  notified_worker BOOLEAN DEFAULT false,
  notified_worker_at TIMESTAMPTZ,
  notified_employer BOOLEAN DEFAULT false,
  notified_employer_at TIMESTAMPTZ,
  appeal_deadline DATE, -- issued_date + 30gg
  appeal_filed BOOLEAN DEFAULT false,
  appeal_date DATE,
  appeal_outcome TEXT,
  pdf_path TEXT, -- encrypted PDF
  physician_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (repository aziendale)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  document_type VARCHAR(50) NOT NULL, -- 'dvr', 'duvri', 'nomina_mc', 'sopralluogo', 'relazione_annuale', ...
  title VARCHAR(300) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0',
  effective_date DATE,
  expiry_date DATE,
  storage_path TEXT NOT NULL,
  mime_type VARCHAR(100) DEFAULT 'application/pdf',
  file_size_bytes BIGINT,
  is_encrypted BOOLEAN DEFAULT true,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training records (formazione)
CREATE TABLE training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id),
  course_type VARCHAR(100) NOT NULL, -- 'generale', 'specifica_basso', 'specifica_medio', 'specifica_alto', 'preposti', 'primo_soccorso', ...
  course_name VARCHAR(300) NOT NULL,
  provider VARCHAR(200),
  duration_hours DECIMAL,
  completion_date DATE NOT NULL,
  expiry_date DATE,
  certificate_number VARCHAR(100),
  certificate_path TEXT, -- encrypted file
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. CRITERI DI SUCCESSO (KPI)

| KPI | Target Fase 1 | Target Fase 4 |
|---|---|---|
| Copertura sorveglianza sanitaria | 100% lavoratori tracciati | 100% con alert automatici |
| Tempo emissione giudizio | < 24h dalla visita | < 1h (firma digitale) |
| Conformita Allegato 3A | 100% campi obbligatori | + storicizzazione completa |
| Uptime sistema | 99.5% | 99.9% |
| Tempo risposta API | < 500ms (p95) | < 200ms (p95) |
| Scadenze mancate | < 5% primo anno | < 1% |
| Soddisfazione utenti | > 3.5/5 | > 4.5/5 |
| Conformita GDPR | DPIA completata | Audit annuale superato |

---

## 9. PROSSIMI PASSI IMMEDIATI

Per avviare lo sviluppo, servono queste decisioni dall'utente:

1. **Conferma dominio**: `mdl.bio-clinic.it` va bene? Serve configurare DNS?
2. **Supabase**: Creare nuovo progetto o usare schema separato nel progetto esistente?
3. **Priorita MVP**: Iniziare da quale modulo? (suggerito: aziende + lavoratori + visite)
4. **Utenti iniziali**: Quante aziende clienti previste al lancio? Quanti lavoratori?
5. **Medico competente di riferimento**: Chi validera i campi della cartella sanitaria?
6. **Budget hosting**: Free tier Cloudflare + Supabase Free/Pro?
7. **Firma digitale**: Quale provider? (InfoCert, Aruba, Namirial)
8. **Timeline**: Data target per MVP operativo?
9. **Dati legacy**: Esistono Excel/fogli da migrare?
10. **Multi-tenancy**: Un solo studio MC o piattaforma multi-studio?

---

## 10. NOTE ARCHITETTURALI AGGIUNTIVE

### Perche Cloudflare Pages e non un VPS tradizionale:
- **Zero maintenance**: No server patching, auto-scaling
- **Edge performance**: Workers eseguiti vicino all'utente (PoP europei)
- **Security**: WAF integrato, DDoS protection, mTLS possibile
- **Cost-effective**: Free tier generoso (100k req/day Workers)
- **Coerenza**: Stesso stack di referti.bio-clinic.it = stesso team puo gestirlo

### Perche NON un framework SPA (React/Vue/Angular):
- **Semplicita**: Il team gestisce vanilla JS su referti senza problemi
- **Performance**: Zero JS framework overhead, bundle < 200KB
- **Manutenibilita**: Nessuna dipendenza da framework versioning
- **CSP**: Nessun `eval()` o inline script necessario
- **Longevita**: Il sistema deve vivere 10+ anni

### Raccomandazione forte: Service Worker per offline
La modalita offline per sopralluoghi aziendali e un requisito critico per MC che visitano sedi remote. Implementare con:
- Service Worker per caching statico
- IndexedDB per dati della visita in corso
- Sync in background quando torna connettivita
- Conflict resolution con timestamp server-wins

---

*Documento prodotto da AI Solution Architect — Da validare con domain expert (Medico Competente) e DPO aziendale prima dell'implementazione.*

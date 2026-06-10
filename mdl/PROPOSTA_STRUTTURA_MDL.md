# PROPOSTA DI STRUTTURA IDEALE — PIATTAFORMA MDL

**Progetto**: Bio-Clinic Medicina del Lavoro  
**Data**: 2026-06-10  
**Scopo**: Guida pratica e operativa per la riorganizzazione e lo sviluppo della piattaforma MDL.  
**Approccio**: Basata sull'analisi completa del codice sorgente attuale (audit del 2026-06-10) e sulle best practice del settore MDL/sorveglianza sanitaria conforme D.Lgs. 81/2008.

> Questo documento è pensato per essere **utilizzato direttamente** come specifica di progetto.  
> Ogni sezione contiene indicazioni concrete: endpoint API, struttura DB, componenti UI, logica di business.

---

## INDICE

1. [Moduli Principali](#1-moduli-principali)
2. [Ruoli Utente](#2-ruoli-utente)
3. [Permessi per Ogni Ruolo](#3-permessi-per-ogni-ruolo)
4. [Menu e Sezioni della Dashboard](#4-menu-e-sezioni-della-dashboard)
5. [Flussi Operativi](#5-flussi-operativi)
6. [Database / Entità Principali](#6-database--entità-principali)
7. [Documenti Generabili](#7-documenti-generabili)
8. [Notifiche Automatiche](#8-notifiche-automatiche)
9. [Report per Azienda, Medico e Segreteria](#9-report-per-azienda-medico-e-segreteria)
10. [Funzioni Indispensabili per il Primo Rilascio (MVP)](#10-funzioni-indispensabili-per-il-primo-rilascio-mvp)
11. [Funzioni Avanzate per la Seconda Fase](#11-funzioni-avanzate-per-la-seconda-fase)

---

## 1. MODULI PRINCIPALI

La piattaforma si articola in **12 moduli operativi** + **3 moduli di sistema**.

### Moduli operativi

| # | Modulo | Descrizione | Stato attuale | Priorità |
|---|---|---|---|---|
| M1 | **Autenticazione & Sessione** | Login, forgot-password, refresh token, logout, MFA opzionale | 30% implementato | MVP |
| M2 | **Gestione Utenti** | CRUD utenti, assegnazione ruoli, inviti, disattivazione | 0% — solo 1 utente hardcoded | MVP |
| M3 | **Anagrafica Aziende** | Aziende, sedi operative, figure della sicurezza, contratti, documenti | 60% — mancano sedi e figure | MVP |
| M4 | **Anagrafica Lavoratori** | Lavoratori, mansioni, storico, import, categorie particolari | 50% — manca cambio mansione | MVP |
| M5 | **Protocolli Sanitari** | Catalogo template, clonazione per mansione, personalizzazione esami | 85% — funzionante | MVP |
| M6 | **Visite Mediche** | Programmazione, anamnesi (Allegato 3A), esame obiettivo, accertamenti, flusso stati | 45% — manca form anamnesi | MVP |
| M7 | **Giudizi di Idoneità** | Emissione, validazione, notifica DL/lavoratore, ricorso art. 41 c.9, PDF | 50% — manca firma e PDF server-side | MVP |
| M8 | **Gestione Documentale** | Upload/download documenti aziendali e sanitari, scadenze, categorizzazione | 60% — funzionale per docs aziendali | MVP |
| M9 | **Scadenzario & Agenda** | Aggregazione scadenze (visite, formazione, documenti), calendario, filtri | 40% — scadenzario base ok, agenda vuota | MVP |
| M10 | **Notifiche & Comunicazioni** | Notifiche in-app, email, convocazioni visite, promemoria scadenze | 5% — solo schema DB | MVP |
| M11 | **Formazione** | Registro corsi, attestati, scadenze formazione obbligatoria | 10% — incluso in scadenzario | Fase 2 |
| M12 | **Reportistica** | Allegato 3B, statistiche MC, report azienda, export PDF/Excel | 0% | Fase 2 |

### Moduli di sistema

| # | Modulo | Descrizione | Stato attuale |
|---|---|---|---|
| S1 | **GDPR & Compliance** | Consensi, export dati personali, diritto cancellazione, informativa | 10% — solo schema |
| S2 | **Audit & Sicurezza** | Tracciamento accessi, visualizzatore log, alert anomalie | 30% — scrittura log ok |
| S3 | **Portali Dedicati** | Portale Lavoratore + Portale Azienda (DL/RSPP) — UI separate dalla dashboard MDL | 0% — directory vuote |

---

## 2. RUOLI UTENTE

### 2.1 — Ruoli definiti

| Codice DB | Nome Visualizzato | Tipo | Accesso |
|---|---|---|---|
| `super_admin` | Amministratore Sistema | Staff MDL | Dashboard completa + pannello admin |
| `medico_competente` | Medico Competente (MC) | Staff clinico | Dashboard completa + dati clinici |
| `medico_collaboratore` | Medico Collaboratore | Staff clinico | Come MC, sotto supervisione, NON firma |
| `segreteria_mdl` | Segreteria MDL | Staff organizzativo | Dashboard organizzativa, NO dati clinici |
| `infermiere` | Infermiere / Tecnico Sanitario | Staff sanitario (**NUOVO**) | Esecuzione esami, misurazioni, upload referti |
| `datore_lavoro` | Datore di Lavoro | Esterno (azienda) | Portale azienda — solo propria azienda, NO clinici |
| `rspp` | RSPP | Esterno (azienda) | Come DL, senza funzioni di modifica |
| `consulente` | Consulente (**NUOVO**) | Esterno (consulente) | Lettura cross-azienda, report — NO modifica |
| `lavoratore` | Lavoratore | Esterno (individuale) | Portale lavoratore — solo propri dati |

### 2.2 — Gerarchia di accesso ai dati sanitari

```
                    ┌─────────────────┐
                    │ DATI CLINICI    │  anamnesi, esame obiettivo,
                    │ (Cartella San.) │  conclusioni, motivazione clinica
                    └───────┬─────────┘
                            │ SOLO
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 medico_competente  medico_collaboratore  super_admin (debug)
                            │
                    ┌───────┴─────────┐
                    │ REFERTI /       │  risultati esami, valori,
                    │ ACCERTAMENTI    │  allegati diagnostici
                    └───────┬─────────┘
                            │
                    ┌───────┴─────────┐
                    ▼                 ▼
             infermiere         (MC / MC collab.)
                            │
                    ┌───────┴─────────┐
                    │ GIUDIZIO        │  tipo idoneità, prescrizioni,
                    │ IDONEITÀ        │  limitazioni (NO motivazione clinica)
                    └───────┬─────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
     datore_lavoro        rspp         lavoratore
     segreteria_mdl
                            │
                    ┌───────┴─────────┐
                    │ DATI ORGANIZ.   │  date visite, stati, scadenze,
                    │ (NON clinici)   │  programmazione, convocazioni
                    └───────┬─────────┘
                            │
            ┌───────┬───────┼───────┬───────┐
            ▼       ▼       ▼       ▼       ▼
        tutti i ruoli (ciascuno scoped al proprio ambito)
```

### 2.3 — Note pratiche per lo sviluppo

- **`infermiere`**: va aggiunto all'enum `mdl_user_role` con migration SQL. Nel codice API si aggiunge ai gruppi dove ha accesso.
- **`consulente`**: va aggiunto all'enum. Può leggere dati di più aziende ma non modificarli.
- **Tutti i nuovi ruoli** necessitano di: RLS policy aggiornate + API role check aggiornato + frontend sidebar condizionale.

---

## 3. PERMESSI PER OGNI RUOLO

### 3.1 — Matrice permessi completa (azione × ruolo)

Legenda: ✅ = accesso completo, 🔍 = solo lettura, 🏢 = solo propria azienda, 👤 = solo propri dati, ❌ = negato, 📋 = solo dati non clinici

| Risorsa / Azione | super_admin | MC | MC collab | segreteria | infermiere | DL | RSPP | consulente | lavoratore |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **AUTENTICAZIONE** |
| Login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Forgot password | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **UTENTI** |
| Lista utenti | ✅ | 🔍 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Crea/modifica utente | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Invita utente | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Disattiva utente | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **AZIENDE** |
| Lista aziende | ✅ | ✅ | ✅ | ✅ | 🔍 | 🏢 | 🏢 | 🔍 | ❌ |
| Crea azienda | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modifica azienda | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Elimina (disattiva) azienda | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sedi operative CRUD | ✅ | ✅ | ❌ | ✅ | ❌ | 🏢 | 🏢🔍 | ❌ | ❌ |
| Figure sicurezza CRUD | ✅ | ✅ | 🔍 | ✅ | ❌ | 🏢 | 🏢🔍 | 🔍 | ❌ |
| **LAVORATORI** |
| Lista lavoratori | ✅ | ✅ | ✅ | ✅ | 🔍 | 🏢📋 | 🏢📋 | 🔍📋 | ❌ |
| Crea lavoratore | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dettaglio lavoratore (anagrafica) | ✅ | ✅ | ✅ | ✅ | 🔍 | 🏢📋 | 🏢📋 | 🔍📋 | 👤 |
| Dettaglio lavoratore (clinico) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Modifica lavoratore | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Cambio mansione | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Import massivo | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **MANSIONI & PROTOCOLLI** |
| Lista mansioni | ✅ | ✅ | ✅ | ✅ | 🔍 | 🏢🔍 | 🏢🔍 | 🔍 | ❌ |
| CRUD mansioni | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Protocolli (template) | ✅ | ✅ | ✅ | ✅ | 🔍 | ❌ | ❌ | ❌ | ❌ |
| CRUD protocolli template | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Protocolli aziendali | ✅ | ✅ | ✅ | ✅ | 🔍 | 🏢🔍 | 🏢🔍 | 🔍 | ❌ |
| Clone protocollo da template | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **VISITE** |
| Lista visite | ✅ | ✅ | ✅ | ✅📋 | ✅📋 | 🏢📋 | 🏢📋 | 🔍📋 | 👤📋 |
| Programma visita | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dettaglio visita (clinico) | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Dettaglio visita (organizzativo) | ✅ | ✅ | ✅ | ✅ | ✅ | 🏢 | 🏢 | 🔍 | 👤 |
| Aggiorna stato visita | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Compila anamnesi / esame obiettivo | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Inserisci misurazioni (altezza, peso, PA) | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **ESAMI / REFERTI** |
| Upload referto | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Vedi referti | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Download referto | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **GIUDIZI** |
| Emetti giudizio idoneità | ✅ | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Firma digitale giudizio | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vedi giudizio (senza motivazione) | ✅ | ✅ | ✅ | ✅ | ❌ | 🏢 | 🏢 | 🔍 | 👤 |
| Download PDF giudizio | ✅ | ✅ | ✅ | ✅ | ❌ | 🏢 | 🏢 | ❌ | 👤 |
| **DOCUMENTI AZIENDALI** |
| Upload/download documenti | ✅ | ✅ | ✅ | ✅ | ❌ | 🏢 | 🏢🔍 | ❌ | ❌ |
| Elimina documenti | ✅ | ✅ | ❌ | ✅ | ❌ | 🏢 | ❌ | ❌ | ❌ |
| **SCADENZARIO** |
| Vedi tutte le scadenze | ✅ | ✅ | ✅ | ✅ | ❌ | 🏢 | 🏢 | 🔍 | 👤 |
| **FORMAZIONE** |
| CRUD corsi/attestati | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vedi formazione | ✅ | ✅ | ✅ | ✅ | ❌ | 🏢 | 🏢 | 🔍 | 👤 |
| **NOTIFICHE** |
| Invia convocazione | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Vedi proprie notifiche | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **REPORT** |
| Allegato 3B | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Report azienda | ✅ | ✅ | ✅ | ✅ | ❌ | 🏢 | 🏢 | 🔍 | ❌ |
| Export Excel | ✅ | ✅ | ✅ | ✅ | ❌ | 🏢 | 🏢 | 🔍 | ❌ |
| **GDPR** |
| Raccolta consenso | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✅ (obbligatorio) |
| Export dati personali | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👤 |
| Richiesta cancellazione | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 👤 (richiesta) |
| **SISTEMA** |
| Visualizza audit log | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configurazione sistema | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

> *MC collaboratore emette giudizio sotto supervisione del MC titolare (il MC deve controfirmare).*

### 3.2 — Implementazione nel codice

Ogni endpoint API deve:
1. Estrarre `ctx.user.role` dal middleware
2. Verificare contro un array costante di ruoli ammessi (pattern già usato nel codice attuale)
3. Per DL/RSPP: aggiungere `if (ctx.user.role === 'datore_lavoro') query.eq('company_id', ctx.user.company_id)`
4. Per dati clinici: verificare `isClinical = ['super_admin','medico_competente','medico_collaboratore'].includes(role)`
5. **NON includere mai `segreteria_mdl` in `isClinical`** (bug da correggere nell'attuale codebase)

---

## 4. MENU E SEZIONI DELLA DASHBOARD

### 4.1 — Dashboard principale MDL (staff interno)

La dashboard principale serve **super_admin, MC, MC collaboratore, segreteria, infermiere**. Il contenuto visibile cambia dinamicamente in base al ruolo.

#### Sidebar navigation (condizionale per ruolo)

```
┌────────────────────────────────────────────────────────┐
│  🏥 Bio-Clinic MDL                                     │
│  Medicina del Lavoro                                   │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📊 Dashboard                   [tutti]                │
│  🏢 Aziende                    [tutti tranne inferm.]  │
│  👥 Lavoratori                  [tutti]                │
│  📋 Visite                      [tutti]                │
│  📅 Agenda                      [tutti]                │
│  ⏰ Scadenzario                 [tutti]                │
│  📑 Protocolli                  [MC, admin]            │
│  🎓 Formazione                  [MC, segr, admin]      │
│  📊 Report                      [MC, admin]            │
│  📤 Comunicazioni               [segr, MC, admin]      │
│  🔐 GDPR                        [MC, admin]            │
│  ⚙️ Impostazioni                [admin]                │
│  📜 Audit Log                   [MC, admin]            │
│                                                        │
│  ─────────────────────                                 │
│  👤 Profilo       🚪 Logout                            │
└────────────────────────────────────────────────────────┘
```

#### Pagina Dashboard — contenuto per ruolo

**Per il Medico Competente:**
```
┌──────────────────────────────────────────────────────────────────┐
│  📊 Dashboard Medica                              Oggi: 10/06/26│
├──────────┬──────────┬──────────┬──────────┬──────────────────────┤
│ 🔴 5     │ 🟠 12    │ 🟡 8     │ 📋 3     │ ✅ 127 in regola    │
│ Scadute  │ Entro 30 │ Entro 60 │ Oggi     │ su 142 lavoratori  │
├──────────┴──────────┴──────────┴──────────┴──────────────────────┤
│                                                                  │
│  📋 Visite di Oggi                                               │
│  ┌────┬────────────┬──────────────────┬────────┬──────────┐     │
│  │ Ora│ Lavoratore │ Azienda          │ Tipo   │ Stato    │     │
│  ├────┼────────────┼──────────────────┼────────┼──────────┤     │
│  │9:00│ Rossi M.   │ Meccanica Rossi  │ Period.│ 🟢 Conf. │     │
│  │10:0│ Bianchi L. │ Meccanica Rossi  │ Prev.  │ 🔵 Progr.│     │
│  │11:0│ Verdi A.   │ Edilizia Verde   │ Period.│ 🟢 Conf. │     │
│  └────┴────────────┴──────────────────┴────────┴──────────┘     │
│                                                                  │
│  ⚠️ Scadenze Urgenti              📈 Attività Ultimo Mese       │
│  • 3 visite scadute               • 28 visite completate        │
│  • 2 DVR in scadenza              • 24 giudizi emessi           │
│  • 1 formazione scaduta           • 3 non idonei temporanei     │
└──────────────────────────────────────────────────────────────────┘
```

**Per la Segreteria:**
```
┌──────────────────────────────────────────────────────────────────┐
│  📊 Dashboard Segreteria                                         │
├──────────┬──────────┬──────────┬──────────────────────────────────┤
│ 📋 3     │ 📞 5     │ 📄 2     │ ⏰ 17 scadenze prossime        │
│ Visite   │ Da conv. │ Doc scad.│                                 │
│ oggi     │          │          │                                 │
├──────────┴──────────┴──────────┴──────────────────────────────────┤
│  📅 Agenda Settimana                                             │
│  [Calendario compatto con visite LUN-VEN]                       │
│                                                                  │
│  📤 Azioni Rapide                                                │
│  [+ Nuova Visita] [+ Nuovo Lavoratore] [📤 Convoca] [📄 Upload]│
└──────────────────────────────────────────────────────────────────┘
```

#### Dettaglio Azienda — 8 Tab

```
[Dipendenti] [Mansioni] [Visite] [Scadenze] [Protocolli] [Documenti] [Figure Sicurezza] [Dati Azienda]
```

- **Dipendenti**: tabella lavoratori con mansione, stato ultima visita, prossima scadenza
- **Mansioni**: CRUD mansioni con fattori di rischio, livello rischio, protocollo associato
- **Visite**: storico + programmate, filtri per stato, link a dettaglio
- **Scadenze**: aggregazione per azienda (visite, formazione, documenti)
- **Protocolli**: card per protocollo con esami raggruppati per categoria
- **Documenti**: slot predefiniti (DVR, Nomina MC, Visura, Doc Amm.) + generici
- **Figure Sicurezza**: **NUOVO** — DL, RSPP, ASPP, RLS, Preposti, Addetti PS/AI
- **Dati Azienda**: anagrafica completa, sedi operative

### 4.2 — Portale Azienda (DL / RSPP)

URL: `mdl.bio-clinic.it/portale-azienda/`

```
┌────────────────────────────────────────────────────────┐
│  🏢 Portale Aziendale — [Nome Azienda S.r.l.]         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📊 Situazione                [prima pagina]           │
│  👥 I Miei Lavoratori                                  │
│  📋 Visite Mediche                                     │
│  ⏰ Scadenze                                           │
│  📄 Documenti Aziendali                                │
│  🎓 Formazione                                         │
│  📊 Report                                             │
│                                                        │
│  ─────────────────                                     │
│  👤 Profilo       🚪 Logout                            │
└────────────────────────────────────────────────────────┘
```

**Dati visibili al DL/RSPP**: nome, cognome, CF, mansione, data ultima visita, esito giudizio (idoneo/non idoneo), prossima scadenza.  
**Dati MAI visibili**: anamnesi, esame obiettivo, referti, motivazione clinica, dati sensibili (gravidanza, disabilità).

### 4.3 — Portale Lavoratore

URL: `mdl.bio-clinic.it/portale-lavoratore/`

```
┌────────────────────────────────────────────────────────┐
│  👤 Portale Lavoratore — [Nome Cognome]                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🏠 I Miei Dati                                        │
│  📋 Le Mie Visite                                      │
│  📑 I Miei Giudizi        [download PDF]               │
│  🎓 La Mia Formazione     [attestati]                  │
│  🔐 Privacy e Consensi    [gestione GDPR]              │
│                                                        │
│  ─────────────────                                     │
│  👤 Profilo       🚪 Logout                            │
└────────────────────────────────────────────────────────┘
```

---

## 5. FLUSSI OPERATIVI

### 5.1 — Flusso completo: dall'onboarding alla consegna del giudizio

```
╔══════════════════════════════════════════════════════════════════════╗
║                  FLUSSO OPERATIVO MDL COMPLETO                      ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ① ONBOARDING AZIENDA                                 [Segreteria]  ║
║  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌────────────┐   ║
║  │ Crea      │──▶│ Inserisci │──▶│ Registra  │──▶│ Carica     │   ║
║  │ Azienda   │   │ Sedi      │   │ DL, RSPP  │   │ DVR +      │   ║
║  │ (anagr.)  │   │ operative │   │ RLS, ecc. │   │ Nomina MC  │   ║
║  └───────────┘   └───────────┘   └───────────┘   └────────────┘   ║
║       │               │               │                │            ║
║       ▼               ▼               ▼                ▼            ║
║  ┌───────────────────────────────────────────────────────────┐     ║
║  │                   Azienda Operativa                       │     ║
║  └───────────────────────────────────────────────────────────┘     ║
║                                                                      ║
║  ② CONFIGURAZIONE SANITARIA                          [MC]           ║
║  ┌───────────┐   ┌───────────┐   ┌───────────────────────────┐    ║
║  │ Crea      │──▶│ Seleziona │──▶│ Clone template ──▶         │    ║
║  │ Mansioni  │   │ template  │   │ Protocollo aziendale       │    ║
║  │ + rischi  │   │ standard  │   │ con esami personalizzati   │    ║
║  └───────────┘   └───────────┘   └───────────────────────────┘    ║
║                                                                      ║
║  ③ INSERIMENTO LAVORATORI                            [Segreteria]   ║
║  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌────────────┐   ║
║  │ Inserisci │──▶│ Assegna   │──▶│ Raccogli  │──▶│ Sistema    │   ║
║  │ lavorat.  │   │ mansione  │   │ consenso  │   │ genera     │   ║
║  │ (o import)│   │ + sede    │   │ GDPR      │   │ scadenze   │   ║
║  └───────────┘   └───────────┘   └───────────┘   └────────────┘   ║
║                                                                      ║
║  ④ CONVOCAZIONE E PROGRAMMAZIONE                     [Segreteria]   ║
║  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌────────────┐   ║
║  │ Scadenz.  │──▶│ Crea      │──▶│ Invia     │──▶│ Lavoratore │   ║
║  │ segnala   │   │ convocaz. │   │ email/SMS │   │ conferma / │   ║
║  │ da visit. │   │ con data  │   │ promemoria│   │ riprogramma│   ║
║  └───────────┘   └───────────┘   └───────────┘   └────────────┘   ║
║                                                                      ║
║  ⑤ VISITA MEDICA                                     [MC / Inferm.] ║
║  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌────────────┐   ║
║  │ Check-in  │──▶│ Inferm.:  │──▶│ MC:       │──▶│ MC:        │   ║
║  │ lavorat.  │   │ PA, peso  │   │ Anamnesi  │   │ Esame      │   ║
║  │ (stato    │   │ altezza,  │   │ completa  │   │ obiettivo  │   ║
║  │  in_corso)│   │ visus     │   │ (Alleg.3A)│   │ + conclus. │   ║
║  └───────────┘   └───────────┘   └───────────┘   └────────────┘   ║
║                                                                      ║
║  ⑥ ACCERTAMENTI STRUMENTALI                         [MC / Inferm.] ║
║  ┌───────────┐   ┌───────────┐   ┌───────────┐                    ║
║  │ Esecuzione│──▶│ Upload    │──▶│ MC valuta │                    ║
║  │ esami da  │   │ referti   │   │ risultati │                    ║
║  │ protocollo│   │ PDF/img   │   │ normalità │                    ║
║  └───────────┘   └───────────┘   └───────────┘                    ║
║                                                                      ║
║  ⑦ GIUDIZIO DI IDONEITÀ                             [MC]           ║
║  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌────────────┐   ║
║  │ MC emette │──▶│ Firma     │──▶│ Sistema   │──▶│ Sistema    │   ║
║  │ giudizio  │   │ digitale  │   │ genera    │   │ calcola    │   ║
║  │ + prescr. │   │ / manuale │   │ PDF cert. │   │ prossima   │   ║
║  │           │   │           │   │           │   │ visita     │   ║
║  └───────────┘   └───────────┘   └───────────┘   └────────────┘   ║
║                                                                      ║
║  ⑧ CONSEGNA E ARCHIVIAZIONE                         [Automatico]   ║
║  ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌────────────┐   ║
║  │ Notifica  │──▶│ Notifica  │──▶│ PDF su    │──▶│ Aggiorna   │   ║
║  │ email DL  │   │ email     │   │ portale   │   │ scadenzario│   ║
║  │ (senza    │   │ lavorat.  │   │ lavorat.  │   │ con nuova  │   ║
║  │ motivaz.) │   │ (completo)│   │ per downl.│   │ data visit.│   ║
║  └───────────┘   └───────────┘   └───────────┘   └────────────┘   ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

### 5.2 — Flusso cambio mansione

```
Segreteria/MC: assegna nuova mansione ──▶ Sistema: chiude mansione precedente (end_date)
──▶ Sistema: verifica se nuovo protocollo diverso ──▶ Se sì: programma visita cambio_mansione
──▶ Scadenzario aggiornato con nuova periodicità
```

### 5.3 — Flusso ricorso art. 41 c.9

```
Emissione giudizio ──▶ Trigger: appeal_deadline = issued_date + 30gg
──▶ Lavoratore impugna (registra nel sistema) ──▶ Notifica al MC
──▶ MC attende esito ASL/SPSAL ──▶ Registra esito ricorso
──▶ Se esito diverso: emette nuovo giudizio (supersedes precedente)
```

### 5.4 — Flusso cessazione lavoratore

```
Segreteria: registra termination_date + reason ──▶ is_active = false
──▶ Se esposto a cancerogeni/mutageni/amianto: programma visita cessazione (obbligatoria)
──▶ Cartella sanitaria archiviata (retention 10/40 anni)
──▶ Vista mdl_retention_review monitora le scadenze di cancellazione
```

---

## 6. DATABASE / ENTITÀ PRINCIPALI

### 6.1 — Schema attuale (17 tabelle — da mantenere integralmente)

```
mdl_users ──────────────┐
                        │
mdl_companies ──────────┤──▶ mdl_company_sites
      │                 │──▶ mdl_safety_contacts
      │                 │──▶ mdl_documents
      │                 │
      ▼                 │
mdl_job_roles ──────────┤
      │                 │
      ▼                 │
mdl_protocols ──────────┤──▶ mdl_protocol_exams
      │                 │
      ▼                 │
mdl_workers ────────────┤──▶ mdl_worker_jobs
      │                 │──▶ mdl_training_records
      │                 │
      ▼                 │
mdl_visits ─────────────┤──▶ mdl_visit_exams
      │                 │
      ▼                 │
mdl_fitness_judgments ──-┘

mdl_notifications (trasversale)
mdl_audit_log (trasversale)
mdl_gdpr_consents (trasversale)
```

### 6.2 — Nuove tabelle proposte (6)

#### T1: `mdl_user_invitations` — Inviti utente

```sql
CREATE TABLE mdl_user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email CITEXT NOT NULL,
  role mdl_user_role NOT NULL,
  company_id UUID REFERENCES mdl_companies(id),  -- per DL/RSPP
  invited_by UUID NOT NULL REFERENCES mdl_users(id),
  token VARCHAR(64) UNIQUE NOT NULL,              -- token univoco per accettazione
  expires_at TIMESTAMPTZ NOT NULL,                -- default: NOW() + 7 days
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Uso**: Admin/MC invita un utente → email con link → utente clicca e completa registrazione → `mdl_users` creato.

#### T2: `mdl_convocations` — Convocazioni a visita

```sql
CREATE TABLE mdl_convocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES mdl_workers(id),
  visit_id UUID REFERENCES mdl_visits(id),        -- creata dopo conferma
  company_id UUID NOT NULL REFERENCES mdl_companies(id),
  convocation_date DATE NOT NULL,                  -- data proposta per la visita
  convocation_time TIME,
  channel VARCHAR(20) NOT NULL DEFAULT 'email',    -- email, sms, pec, carta
  template_type VARCHAR(50) DEFAULT 'standard',    -- tipo lettera
  sent_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  pdf_path TEXT,                                   -- lettera di convocazione PDF
  created_by UUID NOT NULL REFERENCES mdl_users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Uso**: Segreteria genera convocazione → email inviata al lavoratore → lavoratore conferma/rifiuta → se conferma → crea `mdl_visits`.

#### T3: `mdl_system_config` — Configurazione sistema

```sql
CREATE TABLE mdl_system_config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  category VARCHAR(50) NOT NULL DEFAULT 'general',  -- general, email, notification, report
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES mdl_users(id)
);

-- Valori iniziali
INSERT INTO mdl_system_config (key, value, category, description) VALUES
  ('clinic_name', '"Bio-Clinic S.r.l."', 'general', 'Nome della clinica'),
  ('clinic_address', '{"street":"Via Roma 1","city":"Milano","zip":"20100","province":"MI"}', 'general', 'Indirizzo clinica'),
  ('clinic_phone', '"+39 02 1234567"', 'general', 'Telefono clinica'),
  ('clinic_pec', '"bioclinic@pec.it"', 'general', 'PEC clinica'),
  ('notification_days_before', '[60, 30, 15, 7]', 'notification', 'Giorni prima della scadenza per le notifiche'),
  ('default_visit_duration', '30', 'general', 'Durata default visita in minuti'),
  ('working_hours', '{"start":"08:00","end":"18:00","slot_minutes":30}', 'general', 'Orari di lavoro e slot'),
  ('email_from_name', '"Bio-Clinic MDL"', 'email', 'Nome mittente email'),
  ('consent_text_v1', '"Testo informativa privacy..."', 'gdpr', 'Testo consenso GDPR v1');
```

#### T4: `mdl_report_cache` — Cache report generati

```sql
CREATE TABLE mdl_report_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) NOT NULL,     -- allegato_3b, copertura_visite, scadenze_azienda
  reference_year INTEGER,
  company_id UUID REFERENCES mdl_companies(id),
  parameters JSONB DEFAULT '{}',
  data JSONB NOT NULL,                  -- dati del report
  pdf_path TEXT,                        -- PDF generato
  generated_by UUID REFERENCES mdl_users(id),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### T5: `mdl_notification_preferences` — Preferenze notifica per utente

```sql
CREATE TABLE mdl_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES mdl_users(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL,         -- email, sms, in_app
  category VARCHAR(50) NOT NULL,        -- scadenza_visita, convocazione, giudizio, ecc.
  enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(user_id, channel, category)
);
```

#### T6: `mdl_worker_medical_history` — Anamnesi strutturata (opzionale, Fase 2)

```sql
CREATE TABLE mdl_worker_medical_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES mdl_workers(id),
  visit_id UUID REFERENCES mdl_visits(id),
  category VARCHAR(50) NOT NULL,        -- familiare, fisiologica, patologica_remota, patologica_prossima, lavorativa
  question_key VARCHAR(100),            -- chiave strutturata (es. 'fumo', 'alcol', 'diabete_fam')
  answer JSONB NOT NULL,                -- { value: true/false, note: "...", detail: "..." }
  recorded_by UUID NOT NULL REFERENCES mdl_users(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Nota**: questo approccio strutturato è alternativo ai campi testo libero in `mdl_visits`. Permette analisi aggregate e confronto longitudinale.

### 6.3 — Modifiche a tabelle esistenti proposte

| Tabella | Modifica | Motivo |
|---|---|---|
| `mdl_user_role` (enum) | Aggiungere `'infermiere'`, `'consulente'` | Nuovi ruoli proposti |
| `mdl_users` | Aggiungere `invited_by UUID`, `invitation_token VARCHAR(64)` | Tracciamento inviti |
| `mdl_fitness_judgments` | Aggiungere `signed_by UUID REFERENCES mdl_users(id)` | Distinzione MC che emette vs MC che firma |
| `mdl_visits` | Aggiungere `checked_in_at TIMESTAMPTZ`, `checked_in_by UUID` | Tracciamento check-in infermiere |

---

## 7. DOCUMENTI GENERABILI

| # | Documento | Formato | Chi genera | Chi riceve | Endpoint API | Priorità |
|---|---|---|---|---|---|---|
| 1 | **Giudizio di Idoneità** | PDF | MC (firma) | Lavoratore + DL | `POST /api/visits/:id/fitness-judgment/pdf` | MVP |
| 2 | **Cartella Sanitaria (Allegato 3A)** | PDF | MC | Lavoratore (cessazione) | `GET /api/workers/:id/cartella-sanitaria/pdf` | MVP |
| 3 | **Lettera di Convocazione** | PDF + Email | Segreteria | Lavoratore | `POST /api/convocations/:id/send` | MVP |
| 4 | **Allegato 3B** | PDF + CSV | MC | INAIL/ASL | `POST /api/reports/allegato-3b` | Fase 2 |
| 5 | **Elenco Scadenze Azienda** | PDF / Excel | Sistema | DL/RSPP | `GET /api/companies/:id/report/scadenze` | Fase 2 |
| 6 | **Report Visite Effettuate** | PDF / Excel | Sistema | DL / MC | `GET /api/companies/:id/report/visite` | Fase 2 |
| 7 | **Piano Sanitario Aziendale** | PDF | MC | DL | `GET /api/companies/:id/report/piano-sanitario` | Fase 2 |
| 8 | **Export Dati Personali (GDPR)** | JSON + PDF | Sistema | Lavoratore | `GET /api/gdpr/export/:worker_id` | MVP |
| 9 | **Lista Lavoratori** | Excel | Segreteria | Interno | `GET /api/workers/export?company_id=...&format=xlsx` | Fase 2 |
| 10 | **Consuntivo Prestazioni** | PDF / Excel | Sistema | Amministrazione | `GET /api/reports/consuntivo` | Futura |

### Specifiche tecniche per generazione PDF

**Approccio consigliato**: HTML template → PDF via Cloudflare Worker + [jsPDF](https://github.com/parallax/jsPDF) oppure servizio esterno (es. [pdf.co](https://pdf.co) API).

**Struttura PDF Giudizio di Idoneità**:
```
┌──────────────────────────────────────────────────┐
│  [Logo Bio-Clinic]                               │
│  GIUDIZIO DI IDONEITÀ ALLA MANSIONE SPECIFICA    │
│  (art. 41 D.Lgs. 81/2008)                       │
├──────────────────────────────────────────────────┤
│  Dati lavoratore: [nome, CF, data nascita]       │
│  Azienda: [ragione sociale, sede]                │
│  Mansione: [nome mansione, fattori rischio]      │
│  Tipo visita: [preventiva/periodica/...]         │
│  Data visita: [GG/MM/AAAA]                       │
├──────────────────────────────────────────────────┤
│  GIUDIZIO: [tipo]                                │
│  Prescrizioni: [testo]                           │
│  Limitazioni: [testo, temporanee dal/al]         │
│  Prossima visita: [data]                         │
├──────────────────────────────────────────────────┤
│  Il lavoratore ha diritto di presentare ricorso  │
│  entro 30 giorni (art. 41 c.9) all'organo di    │
│  vigilanza territorialmente competente.          │
├──────────────────────────────────────────────────┤
│  Medico Competente:                              │
│  Dott./Dott.ssa [nome]                          │
│  [Firma digitale / immagine firma]               │
│  Data: [GG/MM/AAAA]                             │
└──────────────────────────────────────────────────┘
```

---

## 8. NOTIFICHE AUTOMATICHE

### 8.1 — Tabella notifiche

| # | Evento Trigger | Destinatari | Canale | Timing | Template |
|---|---|---|---|---|---|
| N1 | **Visita in scadenza** | Segreteria | In-app | 60, 30, 15 gg prima | "Visita periodica di [lavoratore] scade il [data]" |
| N2 | **Visita scaduta** | Segreteria + MC | In-app + Email | Giorno stesso + ogni 7gg | "⚠️ Visita di [lavoratore] scaduta da [N] giorni" |
| N3 | **Convocazione visita** | Lavoratore | Email + SMS | Al momento della creazione | Lettera convocazione con data, ora, sede, documenti da portare |
| N4 | **Promemoria visita** | Lavoratore | Email + SMS | 3 gg + 1 gg prima | "Promemoria: visita medica il [data] ore [ora] presso [sede]" |
| N5 | **Giudizio emesso → DL** | Datore di Lavoro | Email | Immediato | PDF giudizio allegato (senza motivazione clinica) |
| N6 | **Giudizio emesso → Lavoratore** | Lavoratore | Email | Immediato | PDF giudizio allegato completo |
| N7 | **Documento aziendale in scadenza** | Segreteria + DL | In-app + Email | 60, 30, 15 gg prima | "Il documento [DVR/Nomina MC] scade il [data]" |
| N8 | **Formazione in scadenza** | Segreteria + DL | In-app + Email | 90, 60, 30 gg prima | "Attestato [corso] di [lavoratore] scade il [data]" |
| N9 | **Lavoratore non presentato** | Segreteria + MC | In-app | Immediato (quando marcato) | "[Lavoratore] non si è presentato alla visita del [data]" |
| N10 | **Scadenza ricorso** | MC | In-app | 15 gg + 7 gg prima | "Scadenza termine ricorso per giudizio di [lavoratore]: [data]" |
| N11 | **Nuovo utente invitato** | Nuovo utente | Email | Immediato | Link di attivazione account con istruzioni |
| N12 | **Consenso GDPR richiesto** | Lavoratore | Email | Al primo inserimento | Richiesta di accesso al portale per consenso |

### 8.2 — Architettura engine notifiche

```
┌───────────────┐     ┌──────────────┐     ┌──────────────┐
│ Cron Trigger  │────▶│ Notification │────▶│ Canale:      │
│ (ogni 6h)     │     │ Engine       │     │ • In-app     │
│               │     │              │     │ • Email      │
│ O             │     │ 1. Query     │     │   (Resend)   │
│               │     │    scadenze  │     │ • SMS        │
│ Event Trigger │────▶│ 2. Genera    │     │   (opz.)     │
│ (post-azione) │     │    record    │     │ • PEC        │
│               │     │ 3. Invia     │     │   (opz.)     │
└───────────────┘     └──────────────┘     └──────────────┘
```

**Implementazione pratica**:
- **Cron**: Cloudflare Workers Cron Trigger (configurabile in wrangler.toml) oppure Supabase pg_cron
- **Email**: API Resend (chiave `RESEND_API_KEY` già configurata nell'env)
- **In-app**: Insert in `mdl_notifications` → frontend polling o WebSocket
- **Template**: HTML con variabili Mustache (libreria già in node_modules del progetto)

---

## 9. REPORT PER AZIENDA, MEDICO E SEGRETERIA

### 9.1 — Report per il Medico Competente

| Report | Descrizione | Dati | Formato | Frequenza |
|---|---|---|---|---|
| **Allegato 3B** | Dati sanitari aggregati per comunicazione annuale | N° esposti per rischio, N° giudizi per tipo, N° patologie segnalate, N° inidoneità, dati aggregati per sesso/età | PDF + CSV (formato INAIL) | Annuale (entro 31/03) |
| **Statistiche giudizi** | Distribuzione giudizi emessi per periodo | Conteggio per tipo (idoneo, prescrizioni, limitazioni, non idoneo), per azienda, per mansione | PDF + grafici | Mensile/annuale |
| **Elenco esposti** | Lavoratori esposti a rischi specifici | Lavoratore, mansione, rischi, ultimo giudizio, prossima visita | PDF / Excel | Su richiesta |
| **Copertura sanitaria** | % lavoratori visitati vs. da visitare | Per azienda, per mansione, scaduti vs. in regola | Dashboard + PDF | Tempo reale |
| **Patologie professionali** | Casistica clinica aggregata (anonimizzata) | Tipologia, frequenza, correlazione con fattori di rischio | PDF | Annuale |

**Query Allegato 3B** (logica):
```sql
-- Conta giudizi per tipo, anno, sesso, fascia età
SELECT
  c.business_name,
  EXTRACT(YEAR FROM fj.issued_date) AS anno,
  w.gender,
  CASE
    WHEN AGE(fj.issued_date, w.date_of_birth) < '30 years' THEN '<30'
    WHEN AGE(fj.issued_date, w.date_of_birth) < '50 years' THEN '30-49'
    ELSE '>=50'
  END AS fascia_eta,
  fj.judgment_type,
  COUNT(*) AS n_giudizi
FROM mdl_fitness_judgments fj
JOIN mdl_workers w ON w.id = fj.worker_id
JOIN mdl_companies c ON c.id = fj.company_id
WHERE EXTRACT(YEAR FROM fj.issued_date) = :anno
GROUP BY 1, 2, 3, 4, 5;
```

### 9.2 — Report per l'Azienda (DL / RSPP)

| Report | Descrizione | Dati visibili |
|---|---|---|
| **Situazione sanitaria** | Stato visite di tutti i lavoratori | Lavoratore, mansione, ultima visita, giudizio (tipo solo), prossima scadenza, stato |
| **Scadenze dettagliate** | Lista scadenze per orizzonte temporale | Visite, formazione, documenti — con giorni mancanti e colore urgenza |
| **Storico visite** | Visite effettuate per periodo | Data, lavoratore, tipo visita, esito (solo tipo giudizio), sede |
| **Elenco per mansione** | Lavoratori raggruppati per mansione | Mansione, n° lavoratori, rischi, protocollo, % copertura |
| **Export lavoratori** | Elenco completo per buste paga / HR | Anagrafica (NO dati sanitari), mansione, data assunzione, contratto |

> ⚠️ **Nessun report aziendale contiene dati clinici** (anamnesi, referti, motivazioni). Solo tipo di giudizio e stato scadenze.

### 9.3 — Report per la Segreteria

| Report | Descrizione | Uso |
|---|---|---|
| **Agenda settimanale** | Visite programmate per settimana con slot orari | Organizzazione giornaliera |
| **Lavoratori da convocare** | Chi ha visita in scadenza e non è ancora convocato | Gestione convocazioni |
| **Statistiche no-show** | Tasso di non presentazione per periodo | Analisi e follow-up |
| **Volumi attività** | N° visite, giudizi, upload per settimana/mese | Pianificazione risorse |
| **Documenti in scadenza** | DVR, nomine, visure in scadenza per azienda | Sollecito aziende |
| **Consuntivo prestazioni** | Visite e esami per azienda → per fatturazione | Amministrazione |

---

## 10. FUNZIONI INDISPENSABILI PER IL PRIMO RILASCIO (MVP)

### 10.1 — Lista MVP con stato e effort

| # | Funzione | Modulo | Stato attuale | Effort residuo | Note implementative |
|---|---|---|---|---|---|
| **F1** | Login email/password | M1 | ✅ 80% | 0.5 gg | Già funzionante, serve solo polish UX |
| **F2** | Forgot password | M1 | ❌ 0% | 1 gg | `supabaseAdmin.auth.resetPasswordForEmail()` + pagina reset |
| **F3** | Auto-refresh token | M1 | ❌ 0% frontend | 1 gg | Intercettare 401 in `apiCall()`, tentare refresh, retry |
| **F4** | CRUD Utenti (admin) | M2 | ❌ 0% | 4 gg | `POST/GET/PATCH /api/users` + UI in Impostazioni. Crea auth user + mdl_users |
| **F5** | Invito utente via email | M2 | ❌ 0% | 2 gg | Tabella `mdl_user_invitations` + email Resend + pagina accettazione |
| **F6** | CRUD Aziende completo | M3 | ✅ 90% | 0.5 gg | Già funzionante — aggiungere validazione ATECO |
| **F7** | CRUD Sedi operative | M3 | ❌ 20% (schema) | 2 gg | API + tab frontend "Sedi" nel dettaglio azienda |
| **F8** | CRUD Figure sicurezza | M3 | ❌ 20% (schema) | 2.5 gg | API + tab "Figure Sicurezza" con form ruolo/nome/contatti/scadenze |
| **F9** | CRUD Lavoratori | M4 | ✅ 75% | 1 gg | Funzionante — aggiungere filtro campi sensibili per DL/RSPP |
| **F10** | Assegnazione/cambio mansione | M4 | ⚠️ 40% | 2 gg | Endpoint `POST /api/workers/:id/job-assignment` + UI |
| **F11** | Catalogo template protocolli | M5 | ✅ 85% | 0.5 gg | Funzionante — sentinel pattern |
| **F12** | Clone protocollo per mansione | M5 | ✅ 90% | 0 gg | Funzionante |
| **F13** | Programmazione visita | M6 | ✅ 75% | 1 gg | Funzionante — aggiungere auto-create visit_exams dal protocollo |
| **F14** | **Form anamnesi completo** | M6 | ❌ 0% frontend | 5 gg | Form strutturato: 5 sezioni anamnesi + esame obiettivo + misurazioni |
| **F15** | Transizioni stato visita | M6 | ✅ 70% | 0.5 gg | Funzionante — validare transizioni (non si può passare da annullata a completata) |
| **F16** | Upload referti/esami | M6 | ✅ 80% | 0.5 gg | Funzionante |
| **F17** | Emissione giudizio idoneità | M7 | ✅ 85% | 0.5 gg | Funzionante — aggiungere supersedes_id automatico |
| **F18** | **PDF giudizio (server-side)** | M7 | ⚠️ 30% | 3 gg | HTML → PDF con header clinica, campi normativi, spazio firma |
| **F19** | Documenti aziendali (slot) | M8 | ✅ 85% | 0 gg | Funzionante |
| **F20** | Scadenzario aggregato | M9 | ✅ 80% | 1 gg | Funzionante — aggiungere filtri per categoria e azioni rapide |
| **F21** | **Fix separazione dati clinici** | Sicurezza | ⚠️ Bug | 1 gg | Rimuovere segreteria da `isClinical`, filtrare campi DL in workers |
| **F22** | **Raccolta consenso GDPR** | S1 | ❌ 0% | 3 gg | Form consenso, testo informativa, timestamp, revoca, blocco accesso senza consenso |
| **F23** | **Portale lavoratore (base)** | S3 | ❌ 0% | 8 gg | Login, i miei dati, le mie visite, i miei giudizi (download PDF), consenso GDPR |
| **F24** | **Notifiche email base** | M10 | ❌ 0% | 4 gg | Giudizio emesso → email DL + email lavoratore. Resend API già configurata |
| | | | **TOTALE EFFORT MVP** | | **~44 gg** |

### 10.2 — Ordine di implementazione consigliato

```
SPRINT 1 (settimana 1-2): SICUREZZA E BASE
  F21 — Fix separazione dati clinici           [1 gg]
  F2  — Forgot password                        [1 gg]
  F3  — Auto-refresh token                     [1 gg]
  F4  — CRUD Utenti (admin)                    [4 gg]
  F5  — Invito utente via email                [2 gg]
  F10 — Cambio mansione                        [1 gg]
                                                 ────
                                                 10 gg

SPRINT 2 (settimana 3-4): COMPLETAMENTO AZIENDA + ANAMNESI
  F7  — CRUD Sedi operative                    [2 gg]
  F8  — CRUD Figure sicurezza                  [2.5 gg]
  F14 — Form anamnesi (parte 1: struttura)     [3 gg]
  F22 — Raccolta consenso GDPR                 [3 gg]
                                                 ────
                                                 10.5 gg

SPRINT 3 (settimana 5-6): DOCUMENTI + PORTALE
  F14 — Form anamnesi (parte 2: completamento) [2 gg]
  F18 — PDF giudizio server-side               [3 gg]
  F23 — Portale lavoratore (base)              [5 gg]
                                                 ────
                                                 10 gg

SPRINT 4 (settimana 7-8): NOTIFICHE + POLISH
  F23 — Portale lavoratore (completamento)     [3 gg]
  F24 — Notifiche email base                   [4 gg]
  F20 — Scadenzario migliorato                 [1 gg]
  F9  — Filtro campi DL/RSPP workers          [1 gg]
  F1,F6,F11-F13,F15-F17,F19 — Polish/fix      [3 gg]
                                                 ────
                                                 12 gg

TOTALE: ~42.5 gg effettivi (8-9 settimane a velocità piena)
```

---

## 11. FUNZIONI AVANZATE PER LA SECONDA FASE

### Fase 2A — Completamento professionale (settimane 9-14)

| # | Funzione | Effort | Descrizione |
|---|---|---|---|
| A1 | **Agenda visiva (calendario)** | 5 gg | Libreria JS calendario (FullCalendar o simile), vista settimana/mese, drag&drop slot, codice colore per tipo visita |
| A2 | **Convocazioni automatiche** | 5 gg | Generazione lettere convocazione, invio email/SMS, tracking conferme, tabella `mdl_convocations` |
| A3 | **Allegato 3B** | 5 gg | Query aggregata, form parametri (anno, azienda), generazione report formato INAIL, export CSV |
| A4 | **Export Excel/CSV** | 3 gg | Libreria `xlsx` server-side o `SheetJS` client-side. Export: lavoratori, visite, scadenze, giudizi |
| A5 | **Import massivo lavoratori** | 4 gg | Upload CSV/Excel, parsing, validazione CF, preview errori, insert batch, assegnazione mansione |
| A6 | **CRUD Formazione** | 4 gg | Endpoint + tab nel dettaglio lavoratore: corso, provider, durata, scadenza, attestato PDF |
| A7 | **Portale azienda dedicato** | 6 gg | UI separata `portale-azienda/`, dashboard KPI, scadenze, download documenti, report |
| A8 | **PDF Cartella Sanitaria (Allegato 3A)** | 5 gg | Raccolta completa dati clinici del lavoratore: anamnesi, visite, esami, giudizi → PDF strutturato |

### Fase 2B — Strumenti avanzati (settimane 15-20)

| # | Funzione | Effort | Descrizione |
|---|---|---|---|
| B1 | **Firma elettronica semplice** | 5 gg | Canvas pad per firma, salvataggio come immagine, inserimento nel PDF. Oppure integrazione con provider FEA (Namirial, InfoCert) |
| B2 | **Dashboard admin con metriche** | 3 gg | Utenti attivi, volumi per mese, errori API, utilizzo storage, top aziende |
| B3 | **Visualizzatore audit log** | 2 gg | Endpoint GET con filtri (utente, azione, data, rischio) + UI tabellare con pagination |
| B4 | **GDPR export/cancellazione** | 3 gg | Export JSON/PDF dei dati personali di un lavoratore, processo di cancellazione con conferma MC |
| B5 | **Report avanzati MC** | 4 gg | Grafici interattivi: distribuzione giudizi, trend temporali, copertura per mansione |
| B6 | **Sicurezza avanzata** | 3 gg | httpOnly cookie per token, Content Security Policy, rate limiting persistente (KV/D1) |
| B7 | **Test automatizzati API** | 5 gg | Setup vitest, mock Supabase, test tutti gli endpoint con scenari per ruolo |

### Fase 3 — Funzioni future (timeline aperta)

| Funzione | Effort | Descrizione |
|---|---|---|
| Integrazione laboratorio (HL7/FHIR) | 15 gg | Ricezione automatica referti dal laboratorio analisi |
| Fatturazione/consuntivi | 8 gg | Tracciamento prestazioni per azienda, generazione pro-forma |
| App mobile lavoratore (PWA) | 12 gg | Progressive Web App con notifiche push |
| Telemedicina | 10 gg | Visite da remoto con videoconferenza integrata + consenso specifico |
| Integrazione PEC | 5 gg | Invio giudizi via PEC con valore legale |
| Multi-tenant / multi-clinica | 15 gg | Più sedi/cliniche, MC condiviso, separazione dati |
| Sopralluogo aziendale | 5 gg | Checklist sopralluogo, verbale, foto, geolocalizzazione |
| AI-assistita: suggerimento protocolli | 8 gg | ML/LLM che suggerisce protocolli in base a ATECO + rischi DVR |

---

## RIEPILOGO EFFORT COMPLESSIVO

| Fase | Settimane | Giorni sviluppo | Contenuto |
|---|---|---|---|
| **MVP** (Primo rilascio) | 8-9 | ~44 gg | 24 funzioni: auth, utenti, aziende complete, lavoratori, anamnesi, giudizi PDF, portale lavoratore, GDPR, notifiche base |
| **Fase 2A** | 6 | ~37 gg | Agenda, convocazioni, Allegato 3B, export, import, formazione, portale azienda, Allegato 3A PDF |
| **Fase 2B** | 5 | ~25 gg | Firma elettronica, dashboard admin, audit viewer, GDPR avanzato, report, sicurezza, test |
| **Fase 3** | Aperta | ~78 gg | Integrazioni esterne, mobile, telemedicina, multi-tenant |

**Totale per piattaforma professionale completa (Fasi 1+2): ~106 giorni di sviluppo**

---

## NOTE FINALI

### Principi guida per lo sviluppo

1. **Privacy by design**: ogni nuova funzione deve considerare la separazione dei dati clinici e il principio di minimizzazione
2. **Audit first**: ogni nuova azione CRUD deve loggare in `mdl_audit_log` PRIMA della risposta al client
3. **Pattern consistente**: seguire il pattern endpoint attuale (middleware → auth → role check → query → audit → response)
4. **Mobile-first**: il CSS deve funzionare su tablet (segreteria in ambulatorio) e smartphone (lavoratore)
5. **Offline-tolerant**: considerare che le visite possono avvenire in sedi aziendali con connettività limitata
6. **Internazionalizzazione**: il campo `language` del lavoratore suggerisce supporto multilingua futuro — predisporre i18n

### Stack consigliato per le nuove funzioni

| Funzione | Tecnologia | Motivo |
|---|---|---|
| PDF generation | jsPDF + html2canvas (client) oppure @react-pdf/renderer (server) | Evita dipendenze pesanti come puppeteer |
| Email | Resend API (già configurato) | Affidabile, buona deliverability, template HTML |
| Calendar | FullCalendar.io (vanilla JS) | Si integra senza framework, ricco di features |
| Excel export | SheetJS (xlsx) | Client-side, nessun costo server |
| Firma digitale | Canvas API + toDataURL() | Implementazione semplice per FES; per FEA usare provider esterno |
| Cron jobs | Cloudflare Cron Triggers (wrangler.toml) | Nativo nella piattaforma, zero costo aggiuntivo |

---

*Fine proposta — documento generato il 2026-06-10*

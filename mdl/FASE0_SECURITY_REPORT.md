# FASE 0 — SICUREZZA, PRIVACY, RUOLI E PERMESSI

**Piattaforma MDL Bio-Clinic** — `mdl.bio-clinic.it`
**Data**: 10/06/2026
**Conforme a**: D.Lgs. 81/2008 art. 25, GDPR art. 9

---

## 1. ELENCO FILE MODIFICATI / CREATI

| # | File | Azione | Righe |
|---|------|--------|-------|
| 1 | `functions/api/lib/permissions.ts` | **CREATO** | 220 |
| 2 | `functions/api/visits/[id]/index.ts` | **RISCRITTO** | 210 → 210 |
| 3 | `functions/api/workers/[id]/index.ts` | **RISCRITTO** | 197 → 197 |
| 4 | `functions/api/workers/index.ts` | **RISCRITTO** | 173 → 185 |
| 5 | `functions/api/files/upload.ts` | **RISCRITTO** | 178 → 178 |
| 6 | `functions/api/files/download.ts` | **RISCRITTO** | 76 → 96 |
| 7 | `public/js/mdl.js` | **MODIFICATO** | 4 blocchi, ~30 righe cambiate |
| 8 | `supabase/migrations/008_mdl_rls_phase0_security.sql` | **CREATO** | 80 |

---

## 2. DESCRIZIONE DELLE MODIFICHE

### 2.1 — Modulo RBAC centralizzato (`lib/permissions.ts`)

**Problema**: Ogni endpoint definiva le proprie costanti `ALLOWED_READ`, `MC_ROLES`, `isClinical` in modo incoerente. Nessun punto unico di verità per i permessi.

**Soluzione**: Creato modulo TypeScript con:
- Costanti: `CLINICAL_ROLES`, `MC_ROLES`, `ADMIN_ROLES`, `COMPANY_ROLES`, `ALL_INTERNAL_ROLES`
- Funzioni di verifica: `canViewClinicalData()`, `canViewSensitiveWorkerData()`, `canWriteClinicalData()`, `canManageAppointments()`, `canWriteCompany()`, `canUploadClinicalFiles()`, `canDownloadClinicalFiles()`, `canViewAuditLog()`, `isCompanyRole()`
- Helper di sanitizzazione: `stripSensitiveWorkerFields()`, `stripClinicalVisitFields()`, `stripFitnessJudgmentClinicalFields()`
- Costanti campo: `WORKER_SAFE_SELECT`, `VISIT_SAFE_SELECT`, `NON_CLINICAL_DOWNLOAD_CATEGORIES`, `SEGRETERIA_UPLOAD_CATEGORIES`, `SEGRETERIA_ALLOWED_STATUSES`, `SEGRETERIA_VISIT_WRITE_FIELDS`, `SEGRETERIA_WORKER_WRITE_FIELDS`, `CLINICAL_WORKER_WRITE_FIELDS`

### 2.2 — Fix visits/[id]/index.ts (BUG CRITICO #1)

**Problema (riga 21)**: `isClinical = MC_ROLES.includes(role) || role === 'segreteria_mdl'`
La segreteria vedeva TUTTI i dati clinici: anamnesi, esame obiettivo, conclusioni, referti, motivazione clinica.

**Correzione**:
- `isClinical` ora usa `canViewClinicalData(role)` → solo `super_admin`, `medico_competente`, `medico_collaboratore`
- La segreteria riceve: scheduling info, status, tipo visita, nome lavoratore
- La segreteria NON riceve: anamnesi (5 campi), esame obiettivo, conclusioni, parametri vitali, visit_exams, clinical_motivation
- PATCH: segreteria limitata a `SEGRETERIA_VISIT_WRITE_FIELDS` (no notes, no clinical fields)
- PATCH status: segreteria può impostare solo `programmata`, `confermata`, `annullata` — NON `completata`, `in_corso`

### 2.3 — Fix workers/[id]/index.ts (BUG CRITICO #2)

**Problema (riga 22)**: `select('*')` restituiva `is_pregnant`, `is_disabled`, `is_minor`, `notes` a tutti i ruoli inclusi DL/RSPP.

**Correzione**:
- DL/RSPP/segreteria: `WORKER_SAFE_SELECT` (select esplicito senza campi sensibili)
- `stripSensitiveWorkerFields()` come safety net aggiuntivo sulla response
- Visit list nel dettaglio worker: `notes` rimosso per ruoli non clinici
- Visit exams (referti): restituiti SOLO a ruoli clinici (array vuoto per altri)
- Fitness judgments: `clinical_motivation` strippata per non-clinici
- PATCH: segreteria usa `SEGRETERIA_WORKER_WRITE_FIELDS` (NON può scrivere `is_pregnant`, `is_disabled`, `is_minor`, `notes`)

### 2.4 — Fix workers/index.ts

**Problema**: Lista lavoratori con `select('*')` esponeva campi sensibili nella lista.

**Correzione**:
- Query select condizionata: `WORKER_SAFE_SELECT` per non-clinici, `*` per MC/SA
- `stripSensitiveWorkerFields()` come safety net sulla lista
- POST: segreteria non può settare `is_pregnant`, `is_disabled`, `is_minor`

### 2.5 — Fix files/upload.ts

**Problema**: Segreteria poteva caricare `referti` (dati clinici).

**Correzione**: Segreteria ristretta a `SEGRETERIA_UPLOAD_CATEGORIES` = `['idoneita', 'company_docs']`. Solo ruoli clinici possono caricare `referti`.

### 2.6 — Fix files/download.ts

**Problema**: Segreteria poteva scaricare qualsiasi file, inclusi referti clinici.

**Correzione**: Tutti i ruoli non-clinici (segreteria, DL, RSPP) ristretti a `NON_CLINICAL_DOWNLOAD_CATEGORIES` = `['idoneita', 'company_docs']`. Solo ruoli clinici possono scaricare `referti`.

### 2.7 — Fix frontend mdl.js

**Modifiche**:
1. Aggiunte costanti RBAC frontend: `CLINICAL_ROLES_FE`, `isClinicalRole()`, `canSeeSensitiveData()`
2. Sezione "Condizioni Particolari" nel dettaglio worker: nascosta per DL/RSPP/segreteria. Mostra solo `Lav. Notturno` (non sensibile)
3. Sezione "Note" nel dettaglio worker: nascosta per non-clinici
4. Sezione "Dati Clinici" nel dettaglio visita: gate `isClinicalRole()` aggiunto (defence in depth)
5. Colonna "Note" nella tabella visite del worker: nascosta per non-clinici

### 2.8 — Migrazione SQL 008

- View `mdl_workers_safe` per query future DL/RSPP
- Commenti esplicativi sulle policy RLS esistenti
- Documentazione delle limitazioni PostgreSQL (no column-level RLS → enforcement app-level)

---

## 3. BUG CORRETTI

| # | Bug | Severità | File | Stato |
|---|-----|----------|------|-------|
| **1** | `segreteria_mdl` in `isClinical` — segreteria vedeva TUTTI i dati clinici | **BLOCCANTE** | `visits/[id]/index.ts:21` | ✅ CORRETTO |
| **2** | Worker detail `select('*')` — `is_pregnant`, `is_disabled`, `is_minor` esposti a DL/RSPP | **BLOCCANTE** | `workers/[id]/index.ts:22` | ✅ CORRETTO |
| **3** | Worker list `select('*')` — campi sensibili nella lista per DL/RSPP | **ALTA** | `workers/index.ts:31` | ✅ CORRETTO |
| **4** | Segreteria poteva caricare referti clinici | **ALTA** | `files/upload.ts:15` | ✅ CORRETTO |
| **5** | Segreteria poteva scaricare referti clinici | **ALTA** | `files/download.ts:8` | ✅ CORRETTO |
| **6** | Segreteria poteva scrivere `is_pregnant`, `is_disabled`, `is_minor` | **ALTA** | `workers/[id]/index.ts:154` | ✅ CORRETTO |
| **7** | Segreteria poteva impostare visita come `completata` | **ALTA** | `visits/[id]/index.ts:157` | ✅ CORRETTO |
| **8** | Visit notes esposte a DL/RSPP (possibili contenuti clinici) | **MEDIA** | `workers/[id]/index.ts:66` | ✅ CORRETTO |
| **9** | Frontend: Condizioni Particolari visibili a tutti | **ALTA** | `mdl.js:1476` | ✅ CORRETTO |
| **10** | Frontend: Dati Clinici visita senza gate ruolo | **MEDIA** | `mdl.js:2562` | ✅ CORRETTO |
| **11** | Nessun modulo RBAC centralizzato — logica duplicata e incoerente | **ALTA** | tutti gli endpoint | ✅ CORRETTO |

---

## 4. NUOVA MATRICE PERMESSI

### Macro-categorie ruoli

| Categoria | Ruoli | Accesso clinico |
|-----------|-------|:-:|
| **Clinico** | `super_admin`, `medico_competente`, `medico_collaboratore` | ✅ |
| **Amministrativo** | `segreteria_mdl` | ❌ |
| **Aziendale** | `datore_lavoro`, `rspp` | ❌ |
| **Lavoratore** | `lavoratore` | Solo propri (futuro) |

### Matrice dettagliata

| Dato | MC/SA | Segreteria | DL/RSPP | Lavoratore |
|------|:-----:|:----------:|:-------:|:----------:|
| Anagrafica base lavoratore | ✅ R/W | ✅ R/W | ✅ R | ✅ R (propri) |
| Dati aziendali | ✅ R/W | ✅ R/W | ✅ R | ❌ |
| Mansione / reparto | ✅ R/W | ✅ R/W | ✅ R | ✅ R |
| Rischi / DVR / protocollo | ✅ R/W | ✅ R | ✅ R | ❌ |
| Appuntamenti (scheduling) | ✅ R/W | ✅ R/W | ✅ R | ✅ R |
| Stato visita | ✅ R/W | ✅ R (no completata) | ✅ R | ✅ R |
| Giudizio idoneità (tipo + limitazioni + prescrizioni) | ✅ R/W | ✅ R | ✅ R | ✅ R |
| clinical_motivation del giudizio | ✅ R/W | ❌ | ❌ | ❌ |
| Documenti aziendali (DVR, Nomina MC...) | ✅ R/W | ✅ R/W | ✅ R/W | ❌ |
| Certificati idoneità (file PDF) | ✅ R/W | ✅ R | ✅ R | ✅ R |
| **is_pregnant** | ✅ R/W | ❌ | ❌ | ✅ R |
| **is_disabled** | ✅ R/W | ❌ | ❌ | ✅ R |
| **is_minor** | ✅ R/W | ❌ | ❌ | ✅ R |
| **notes (worker)** | ✅ R/W | ❌ | ❌ | ✅ R |
| **Anamnesi (5 campi)** | ✅ R/W | ❌ | ❌ | ✅ R |
| **Esame obiettivo** | ✅ R/W | ❌ | ❌ | ✅ R |
| **Conclusioni cliniche** | ✅ R/W | ❌ | ❌ | ✅ R |
| **Parametri vitali** | ✅ R/W | ❌ | ❌ | ✅ R |
| **Visit exams / referti** | ✅ R/W | ❌ | ❌ | ✅ R |
| **File referti (upload)** | ✅ upload | ❌ | ❌ | ❌ |
| **File referti (download)** | ✅ download | ❌ | ❌ | ✅ (futuro) |
| **Notes visita** | ✅ R/W | ❌ | ❌ | ✅ R |
| is_night_worker | ✅ R/W | ✅ R/W | ✅ R | ✅ R |
| Audit log | ✅ R | ❌ | ❌ | ❌ |
| Consensi GDPR | ✅ R | ❌ | ❌ | ✅ R/W |

---

## 5. MIGRAZIONI / MODIFICHE DATABASE

### Migrazione 008 (`008_mdl_rls_phase0_security.sql`)

| Oggetto | Tipo | Descrizione |
|---------|------|-------------|
| `mdl_workers_safe` | VIEW | Worker senza campi sensibili (is_pregnant, is_disabled, is_minor, notes) |
| `mdl_fitness_select` | COMMENT | Documenta che clinical_motivation deve essere strippata a livello app |
| `mdl_visits_select` | COMMENT | Documenta che campi clinici devono essere strippati a livello app |
| `mdl_audit_insert` | COMMENT | Documenta che la policy `WITH CHECK (true)` è sicura solo con service_role |

**NOTA**: PostgreSQL non supporta RLS a livello di colonna. La separazione dei dati clinici è enforced a livello API tramite `permissions.ts`. Il database fornisce defence-in-depth per l'accesso diretto.

**Stato migrazione**: La migrazione è stata scritta come file SQL. Deve essere eseguita manualmente su Supabase quando pronta per il deploy.

---

## 6. TEST CONSIGLIATI

### Test manuali prioritari

| # | Test | Endpoint | Atteso |
|---|------|----------|--------|
| 1 | Login come segreteria → GET `/api/visits/:id` | `visits/[id]` | anamnesi, esame obiettivo, conclusioni = `null` |
| 2 | Login come segreteria → GET `/api/visits/:id` | `visits/[id]` | `visitExams = []` |
| 3 | Login come segreteria → GET `/api/visits/:id` | `visits/[id]` | `fitnessJudgment.clinical_motivation` assente |
| 4 | Login come DL → GET `/api/workers/:id` | `workers/[id]` | `is_pregnant`, `is_disabled`, `is_minor`, `notes` assenti |
| 5 | Login come DL → GET `/api/workers` | `workers/` | stessi campi assenti nella lista |
| 6 | Login come segreteria → POST `/api/files/upload` con `category=referti` | `files/upload` | 403 |
| 7 | Login come segreteria → GET `/api/files/download?path=referti/...` | `files/download` | 403 |
| 8 | Login come DL → GET `/api/files/download?path=referti/...` | `files/download` | 403 |
| 9 | Login come segreteria → PATCH `/api/visits/:id` con `status=completata` | `visits/[id]` | 403 |
| 10 | Login come segreteria → PATCH `/api/workers/:id` con `is_pregnant=true` | `workers/[id]` | campo ignorato (non in allowedFields) |
| 11 | Login come MC → GET `/api/visits/:id` | `visits/[id]` | tutti i dati clinici presenti |
| 12 | Login come MC → GET `/api/workers/:id` | `workers/[id]` | tutti i campi sensibili presenti |

### Test automatizzati consigliati (futuri)

```
# Framework suggerito: Vitest o Jest con supertest-like HTTP calls

describe('RBAC - Segreteria restrictions', () => {
  test('GET /api/visits/:id strips clinical data for segreteria');
  test('GET /api/visits/:id returns visitExams=[] for segreteria');
  test('GET /api/workers/:id strips sensitive fields for segreteria');
  test('POST /api/files/upload rejects referti for segreteria');
  test('GET /api/files/download rejects referti for segreteria');
  test('PATCH /api/visits/:id rejects completata for segreteria');
  test('PATCH /api/workers/:id ignores is_pregnant for segreteria');
});

describe('RBAC - DL/RSPP restrictions', () => {
  test('GET /api/workers/:id strips sensitive fields for DL');
  test('GET /api/workers strips sensitive fields in list for RSPP');
  test('GET /api/visits/:id strips clinical data for DL');
  test('GET /api/files/download rejects referti for DL');
  test('GET /api/workers/:id - DL cannot see other company workers');
});

describe('RBAC - MC full access', () => {
  test('GET /api/visits/:id returns all clinical data for MC');
  test('GET /api/workers/:id returns all sensitive fields for MC');
  test('POST /api/files/upload accepts referti for MC');
  test('PATCH /api/visits/:id allows completata for MC');
});
```

---

## 7. CHECKLIST PRIVACY / GDPR

| # | Requisito | Stato | Note |
|---|-----------|:-----:|------|
| 1 | Dati sanitari (art. 9 GDPR) accessibili solo a ruoli clinici | ✅ | Implementato in `permissions.ts` |
| 2 | Separazione dati clinici DL (D.Lgs. 81/2008 art. 25) | ✅ | DL vede solo giudizio idoneità |
| 3 | Segreteria esclusa da dati clinici | ✅ | Fix BUG #1 |
| 4 | is_pregnant / is_disabled nascosti all'azienda | ✅ | Fix BUG #2 |
| 5 | Referti clinici non scaricabili da non-clinici | ✅ | Fix download.ts |
| 6 | Referti clinici non caricabili da segreteria | ✅ | Fix upload.ts |
| 7 | clinical_motivation visibile solo a MC | ✅ | Strip in response |
| 8 | Anamnesi/esame obiettivo visibili solo a MC | ✅ | Strip in response |
| 9 | Notes visita nascoste a non-clinici | ✅ | Strip in response |
| 10 | Defence in depth: frontend + backend | ✅ | Gate su entrambi i livelli |
| 11 | Audit log su operazioni sensibili | ✅ | Già presente (precedente) |
| 12 | Consensi GDPR implementati | ❌ | FASE successiva — tabella esiste ma nessun flusso |
| 13 | Diritto di accesso lavoratore (art. 15) | ❌ | FASE successiva — nessun portale lavoratore |
| 14 | Diritto di rettifica (art. 16) | ❌ | FASE successiva |
| 15 | Data retention policy | ⚠️ | Migrazione 005 presente, non automatizzata |
| 16 | Registro trattamenti (art. 30) | ❌ | FASE successiva |

---

## 8. CONFERMA BUG CRITICI RISOLTI

### ✅ BUG #1: segreteria_mdl in isClinical

**PRIMA**: `visits/[id]/index.ts` riga 21:
```typescript
const isClinical = MC_ROLES.includes(ctx.user.role) || ctx.user.role === 'segreteria_mdl';
```

**DOPO**:
```typescript
const isClinical = canViewClinicalData(ctx.user.role);
// canViewClinicalData → solo ['super_admin', 'medico_competente', 'medico_collaboratore']
```

**Impatto**: La segreteria ora riceve visite con tutti i campi clinici a `null`, `visitExams = []`, `fitnessJudgment` senza `clinical_motivation`. Non può più impostare `status: 'completata'`.

### ✅ BUG #2: Worker detail espone campi sensibili a DL/RSPP

**PRIMA**: `workers/[id]/index.ts` riga 22:
```typescript
.select(`*,  ...`)  // restituisce is_pregnant, is_disabled, is_minor, notes
```

**DOPO**:
```typescript
const workerSelect = canSeeSensitive
  ? `*, ...`
  : `${WORKER_SAFE_SELECT}, ...`;
// WORKER_SAFE_SELECT non include is_pregnant, is_disabled, is_minor, notes
```

**Impatto**: DL/RSPP/segreteria non ricevono più `is_pregnant`, `is_disabled`, `is_minor`, `notes` né nella lista né nel dettaglio. Il frontend non mostra più la sezione "Condizioni Particolari" (tranne `is_night_worker` non sensibile).

---

## ARCHITETTURA SICUREZZA RISULTANTE

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (mdl.js)                       │
│  isClinicalRole() → gate frontend per dati clinici       │
│  canSeeSensitiveData() → gate per condizioni particolari │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / Bearer JWT
                         ▼
┌─────────────────────────────────────────────────────────┐
│               CLOUDFLARE PAGES FUNCTIONS                 │
│  _middleware.ts → Auth + CORS + Rate Limiting            │
│                                                          │
│  lib/permissions.ts ← SINGLE SOURCE OF TRUTH             │
│    ├── canViewClinicalData(role)                         │
│    ├── canViewSensitiveWorkerData(role)                  │
│    ├── stripSensitiveWorkerFields(worker)                │
│    ├── stripClinicalVisitFields(visit)                   │
│    └── stripFitnessJudgmentClinicalFields(judgment)      │
│                                                          │
│  Ogni endpoint: import + check + strip prima di respond  │
└────────────────────────┬────────────────────────────────┘
                         │ service_role (bypasses RLS)
                         ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE / POSTGRESQL                  │
│  RLS policies = defence-in-depth per accesso diretto     │
│  mdl_workers_safe VIEW = query sicura per DL/RSPP        │
│  mdl_visit_exams: SELECT solo MC (RLS)                   │
└─────────────────────────────────────────────────────────┘
```

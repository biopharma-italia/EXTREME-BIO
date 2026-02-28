# 🏗️ BIO-CLINIC ADMIN PANEL — ARCHITETTURA COMPLETA v1.0

## DOCUMENTO DI RIFERIMENTO PERMANENTE

| Campo | Valore |
|-------|--------|
| **Data** | 2026-02-28 |
| **Stato** | APPROVATO — Riferimento per implementazione |
| **Versione** | 1.0 |
| **Scope** | Pannello Admin + migrazione DB + API Layer |

---

# INDICE

1. [Stato Attuale del Progetto](#1-stato-attuale-del-progetto)
2. [Architettura Target](#2-architettura-target)
3. [Schema Database Supabase](#3-schema-database-supabase)
4. [Moduli Admin Panel](#4-moduli-admin-panel)
5. [API Layer (Cloudflare Functions)](#5-api-layer-cloudflare-functions)
6. [Inventario Token e Credenziali](#6-inventario-token-e-credenziali)
7. [Limiti Infrastrutturali](#7-limiti-infrastrutturali)
8. [Piano di Migrazione Dati](#8-piano-di-migrazione-dati)
9. [Piano Implementazione per Fasi](#9-piano-implementazione-per-fasi)
10. [Regole di Validazione e Integrità](#10-regole-di-validazione-e-integrita)
11. [Sicurezza e RBAC](#11-sicurezza-e-rbac)
12. [Checklist Pre-Implementazione](#12-checklist-pre-implementazione)

---

# 1. STATO ATTUALE DEL PROGETTO

## 1.1 Infrastruttura Attiva

| Componente | Tecnologia | Dominio | Stato |
|------------|-----------|---------|-------|
| **Sito principale** | Cloudflare Pages (statico) | bio-clinic.it | ✅ Produzione |
| **Referti** | Cloudflare Pages + Supabase PostgreSQL | referti.bio-clinic.it | ✅ Produzione |
| **Booking Lab** | Cloudflare Pages Functions + D1 SQLite | bio-clinic.it/api/booking/* | ✅ Produzione |
| **Contatti** | Cloudflare Pages Function + Resend | bio-clinic.it/api/contact | ✅ Produzione |
| **Tracking** | GTM + GA4 (CGE v4 Enterprise) | bio-clinic.it | ✅ Produzione |

## 1.2 Dati Attuali — Flat File (da migrare)

| File | Percorso | Record | Dimensione | Ruolo |
|------|----------|--------|------------|-------|
| `listino-processed.json` | site/data/ | **1.136 esami** | 240 KB | Listino prezzi laboratorio |
| `physicians.json` | site/data/entities/ | 23 medici | 19 KB | Dati medici (parziale) |
| `physicians-complete.json` | site/data/entities/ | 23+ medici | 57 KB | Dati medici estesi |
| `procedures.json` | site/data/entities/ | 38 prestazioni | 46 KB | Prestazioni specialistiche |
| `specialties.json` | site/data/entities/ | 11 specialità | 9 KB | Specialità cliniche |
| `tests.json` | site/data/entities/ | 23 esami | 35 KB | Esami strutturati |
| `packs.json` | site/data/entities/ | 12 pacchetti | 17 KB | Pacchetti analisi |
| `pathways.json` | site/data/entities/ | 12 percorsi | 22 KB | Percorsi clinici |
| `unified-entities.json` | site/data/ | 96 entità | 72 KB | Indice unificato |
| `search/index.json` | site/data/search/ | indice ricerca | 78 KB | Indice per motore di ricerca |
| `medici.json` | site/data/ | dati legacy | 15 KB | Compatibilità legacy |
| `_services-data.js` | functions/api/booking/ | 10+ servizi | 4.5 KB | Fallback booking |
| **TOTALE** | | | **~639 KB client** | |

## 1.3 Dati YAML v2 (Source of Truth attuale)

| File | Percorso | Record |
|------|----------|--------|
| `physicians.yaml` | site/data/v2/entities/ | 1.080 righe |
| `procedures.yaml` | site/data/v2/entities/ | 2.424 righe |
| `specialties.yaml` | site/data/v2/entities/ | 669 righe |
| `schema.yaml` | site/data/v2/config/ | Schema formale v2.1 |

## 1.4 Database Esistenti

### Supabase PostgreSQL (Referti)
- **URL**: `https://mdxqgzkxrcrotxxbhoai.supabase.co`
- **Tabelle**: users, user_sessions, reports, report_files, notifications, audit_log, gdpr_consents, gdpr_data_requests, password_reset_tokens, totp_secrets
- **RLS**: Attivo su tutte le tabelle
- **Ruoli**: patient, lab_technician, physician, admin, super_admin

### Cloudflare D1 (Booking)
- **Nome**: `bio-clinic-booking`
- **ID**: `2774d698-2d22-41bd-aa69-5b07de04d749`
- **Tabelle**: services, slots, bookings (schema base)
- **Uso**: Prenotazioni laboratorio

### Cloudflare KV
- **Binding**: `BOOKING_KV`
- **ID**: `f7eaf83738ea465baf6f043f9b94641a`
- **Uso**: Rate limiting, cache fallback

## 1.5 Pagine HTML Statiche

| Metrica | Valore |
|---------|--------|
| **Pagine totali** | 339 HTML |
| **Specialità con directory** | 15+ cartelle |
| **Pagine equipe** | ~67 previste (parziale) |
| **JSON-LD Schema.org** | Presente in ogni pagina (statico) |

---

# 2. ARCHITETTURA TARGET

## 2.1 Principio Architetturale

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN PANEL (SPA)                        │
│          admin.bio-clinic.it (Cloudflare Pages)              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│  │Medici│ │Presta│ │Labor.│ │Prenot│ │Contat│ │Config│    │
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘    │
└─────┼────────┼────────┼────────┼────────┼────────┼──────────┘
      │        │        │        │        │        │
      ▼        ▼        ▼        ▼        ▼        ▼
┌─────────────────────────────────────────────────────────────┐
│                   API LAYER (Unified)                         │
│           Cloudflare Pages Functions /api/admin/*             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Auth Middleware → RBAC → Validation → Handler        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────┬────────────────┬──────────────────────────────┘
              │                │
    ┌─────────▼──────┐  ┌─────▼──────────┐
    │   SUPABASE     │  │   CLOUDFLARE   │
    │   PostgreSQL   │  │   D1 + KV      │
    │                │  │                │
    │  • specialties │  │  • bookings    │
    │  • physicians  │  │  • slots       │
    │  • procedures  │  │  • services    │
    │  • lab_tests   │  │  • booking_kv  │
    │  • packs       │  │                │
    │  • pathways    │  └────────────────┘
    │  • contacts    │
    │  • settings    │
    │  • audit_log   │
    │  • users(admin)│
    │  • reports ✓   │  (GIÀ ESISTENTE)
    └────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BUILD PIPELINE                             │
│  DB → JSON export → Static site rebuild → Deploy            │
│  (Trigger: admin save → webhook → GitHub Action)             │
└──────────────────────┬──────────────────────────────────────┘
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SITO PUBBLICO (invariato)                        │
│                   bio-clinic.it                               │
│  339 pagine HTML statiche + JSON-LD + search index           │
│  LE PAGINE NON CAMBIANO STRUTTURA — solo dati aggiornati     │
└─────────────────────────────────────────────────────────────┘
```

## 2.2 Vincolo Fondamentale

> **LE PAGINE HTML DEL SITO PUBBLICO NON DEVONO ESSERE MODIFICATE NELLA STRUTTURA.**
> Solo i **dati** (prezzi, medici, procedure, testi brevi) vengono gestiti dal DB
> e iniettati nelle pagine tramite il build pipeline esistente.

## 2.3 Decisione Architetturale: Perché Supabase (non D1)

| Criterio | Supabase PostgreSQL | Cloudflare D1 |
|----------|-------------------|---------------|
| **Già attivo** | ✅ (referti) | ✅ (solo booking) |
| **RLS nativo** | ✅ Row Level Security | ❌ Manuale |
| **Full-text search** | ✅ `tsvector` nativo | ❌ Limitato |
| **Relazioni complesse** | ✅ FK, JOIN, VIEW | ⚠️ Limitato (SQLite) |
| **Auth integrata** | ✅ Supabase Auth | ❌ Da implementare |
| **Storage file** | ✅ Supabase Storage | ❌ R2 separato |
| **Realtime** | ✅ Subscriptions | ❌ Non disponibile |
| **Dashboard** | ✅ UI integrata | ⚠️ Solo CLI |
| **Costo** | Free tier: 500MB, 50k rows | Free: 5GB, 5M read/day |
| **Backup** | ✅ Point-in-time (Pro) | ❌ Manuale |

**Decisione**: Le nuove tabelle admin vanno su **Supabase PostgreSQL** (stesso progetto dei Referti). D1 resta solo per le prenotazioni lab (già funzionante).

---

# 3. SCHEMA DATABASE SUPABASE

## 3.1 Nuove Tabelle (Admin Panel)

### Tabella: `specialties`
```sql
CREATE TABLE specialties (
  id              TEXT PRIMARY KEY,           -- slug: "ginecologia"
  name            TEXT NOT NULL,              -- "Ginecologia"
  name_extended   TEXT,                       -- "Ginecologia e Ostetricia"
  slug            TEXT NOT NULL UNIQUE,       -- "ginecologia"
  parent_id       TEXT REFERENCES specialties(id),  -- per sub-specialità
  
  -- Display
  icon            TEXT,                       -- emoji o icon class
  color_primary   TEXT,                       -- "#E91E63"
  color_dark      TEXT,
  color_light     TEXT,
  
  -- Content
  description_short TEXT,                     -- max 200 chars
  description_long  TEXT,                     -- markdown completo
  
  -- Page Config (JSONB per flessibilità sezioni pagina)
  page_config     JSONB DEFAULT '{}',
  
  -- Visibility
  show_in_menu    BOOLEAN DEFAULT true,
  show_in_homepage BOOLEAN DEFAULT false,
  featured        BOOLEAN DEFAULT false,
  menu_order      INTEGER DEFAULT 100,
  
  -- Search
  search_vector   TSVECTOR,                  -- full-text search
  
  -- Meta
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'hidden')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_specialties_status ON specialties(status);
CREATE INDEX idx_specialties_search ON specialties USING GIN(search_vector);
CREATE INDEX idx_specialties_menu_order ON specialties(menu_order);
```

### Tabella: `physicians`
```sql
CREATE TABLE physicians (
  id              TEXT PRIMARY KEY,           -- slug: "salvatore-dessole"
  title           TEXT NOT NULL CHECK (title IN ('Prof.', 'Dott.', 'Dott.ssa')),
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  name            TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  display_name    TEXT GENERATED ALWAYS AS (title || ' ' || first_name || ' ' || last_name) STORED,
  
  -- Specialty
  specialty_id    TEXT NOT NULL REFERENCES specialties(id),
  
  -- Professional
  job_title       TEXT,                       -- "Direttore Sanitario"
  role_badges     TEXT[] DEFAULT '{}',        -- {"Direttore Sanitario", "Prof. Emerito"}
  is_director     BOOLEAN DEFAULT false,
  
  -- Bio
  bio_short       TEXT,                       -- max 200 chars
  bio_long        TEXT,                       -- markdown
  
  -- Media
  photo_url       TEXT,                       -- URL foto (Supabase Storage)
  
  -- Booking
  booking_enabled     BOOLEAN DEFAULT true,
  miodottore_url      TEXT,
  miodottore_id       TEXT,
  direct_phone        BOOLEAN DEFAULT false,
  online_booking      BOOLEAN DEFAULT false,
  
  -- Availability
  availability    TEXT[] DEFAULT '{}',        -- {"Lun", "Mar", "Mer"}
  
  -- Symptoms (per matching ricerca)
  symptoms        TEXT[] DEFAULT '{}',
  
  -- Publications
  publications    JSONB DEFAULT '[]',         -- [{name, url, publisher}]
  
  -- Visibility
  show_in_equipe       BOOLEAN DEFAULT true,
  show_in_specialty    BOOLEAN DEFAULT true,
  show_booking_widget  BOOLEAN DEFAULT true,
  featured_on_homepage BOOLEAN DEFAULT false,
  priority_order       INTEGER DEFAULT 100,
  
  -- SEO
  seo_title       TEXT,
  seo_description TEXT,
  seo_keywords    TEXT[],
  
  -- Search
  search_vector   TSVECTOR,
  
  -- Meta
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'hidden')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_physicians_specialty ON physicians(specialty_id);
CREATE INDEX idx_physicians_status ON physicians(status);
CREATE INDEX idx_physicians_search ON physicians USING GIN(search_vector);
CREATE INDEX idx_physicians_priority ON physicians(priority_order);
```

### Tabella: `procedures`
```sql
CREATE TABLE procedures (
  id              TEXT PRIMARY KEY,           -- slug: "visita-ginecologica"
  name            TEXT NOT NULL,
  name_extended   TEXT,
  slug            TEXT NOT NULL UNIQUE,
  
  -- Classification
  specialty_id    TEXT NOT NULL REFERENCES specialties(id),
  category        TEXT NOT NULL CHECK (category IN ('visita', 'diagnostica', 'esame', 'trattamento', 'intervento')),
  page_type       TEXT NOT NULL CHECK (page_type IN ('A', 'B', 'C', 'D')),
  -- A = Pagina dedicata, B = Hub aggregato, C = Solo in percorso, D = Solo listino
  
  -- Content
  description_short TEXT,
  description_long  TEXT,                     -- markdown
  
  -- Clinical Info
  duration_minutes  INTEGER,
  preparation_required BOOLEAN DEFAULT false,
  fasting_required    BOOLEAN DEFAULT false,
  preparation_notes   TEXT,
  follow_up_notes     TEXT,
  
  -- Indications & Contraindications
  indications     TEXT[] DEFAULT '{}',
  contraindications TEXT[] DEFAULT '{}',
  
  -- Related
  related_procedure_ids TEXT[] DEFAULT '{}',  -- FK logica
  
  -- FAQ
  faqs            JSONB DEFAULT '[]',         -- [{question, answer}]
  
  -- Pricing
  show_price      BOOLEAN DEFAULT false,
  price           DECIMAL(10,2),
  price_note      TEXT,                       -- "Da €50" / "Su preventivo"
  
  -- Upsell
  upsell_pack_id  TEXT,                       -- FK -> pathways
  
  -- SEO
  seo_title       TEXT,
  seo_description TEXT,
  schema_org_type TEXT DEFAULT 'MedicalProcedure',
  
  -- Search
  search_vector   TSVECTOR,
  
  -- Meta
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'hidden')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_procedures_specialty ON procedures(specialty_id);
CREATE INDEX idx_procedures_category ON procedures(category);
CREATE INDEX idx_procedures_page_type ON procedures(page_type);
CREATE INDEX idx_procedures_status ON procedures(status);
CREATE INDEX idx_procedures_search ON procedures USING GIN(search_vector);
```

### Tabella: `lab_tests`
```sql
CREATE TABLE lab_tests (
  id              TEXT PRIMARY KEY,           -- slug: "emocromo-completo"
  name            TEXT NOT NULL,              -- "Emocromo Completo"
  name_extended   TEXT,                       -- nome lungo
  code            TEXT,                       -- codice nomenclatore
  
  -- Classification
  category        TEXT NOT NULL,              -- "Ematologia", "Biochimica", etc.
  subcategory     TEXT,                       -- sotto-categoria
  
  -- Sample
  sample_type     TEXT,                       -- "sangue", "urina", "tampone"
  tube_type       TEXT,                       -- "EDTA", "Siero", etc.
  sample_volume   TEXT,                       -- "5 ml"
  
  -- Preparation
  fasting_required BOOLEAN DEFAULT false,
  preparation_notes TEXT,
  
  -- Results
  turnaround_time  TEXT,                      -- "24h", "48-72h", "7 giorni"
  reference_ranges JSONB DEFAULT '{}',        -- {min, max, unit, age_group}
  
  -- Pricing
  price           DECIMAL(10,2),
  price_urgent    DECIMAL(10,2),              -- prezzo urgente
  
  -- Relations
  related_test_ids TEXT[] DEFAULT '{}',       -- FK logica
  
  -- Symptoms (per matching ricerca)
  symptoms        TEXT[] DEFAULT '{}',
  
  -- Search
  search_vector   TSVECTOR,
  
  -- Meta
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'hidden')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_lab_tests_category ON lab_tests(category);
CREATE INDEX idx_lab_tests_status ON lab_tests(status);
CREATE INDEX idx_lab_tests_search ON lab_tests USING GIN(search_vector);
CREATE INDEX idx_lab_tests_price ON lab_tests(price);
```

### Tabella: `packs`
```sql
CREATE TABLE packs (
  id              TEXT PRIMARY KEY,           -- slug: "checkup-base"
  name            TEXT NOT NULL,
  name_extended   TEXT,
  slug            TEXT NOT NULL UNIQUE,
  
  -- Type
  type            TEXT NOT NULL CHECK (type IN ('checkup', 'screening', 'pack_lab', 'pack_specialist')),
  
  -- Content
  description_short TEXT,
  description_long  TEXT,
  tagline         TEXT,
  
  -- Target
  target_audience TEXT,                       -- "Donne 30-50 anni"
  
  -- Pricing
  price_total     DECIMAL(10,2),
  price_note      TEXT,
  discount_pct    DECIMAL(5,2),               -- % sconto rispetto a singoli
  
  -- SEO
  seo_title       TEXT,
  seo_description TEXT,
  
  -- CTA
  cta_text        TEXT DEFAULT 'Prenota',
  cta_url         TEXT,
  cta_phone       TEXT,
  
  -- Search
  search_vector   TSVECTOR,
  
  -- Meta
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'hidden')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_packs_type ON packs(type);
CREATE INDEX idx_packs_status ON packs(status);
```

### Tabella: `pathways`
```sql
CREATE TABLE pathways (
  id              TEXT PRIMARY KEY,           -- slug: "slim-care"
  name            TEXT NOT NULL,
  name_extended   TEXT,
  slug            TEXT NOT NULL UNIQUE,
  
  -- Type
  type            TEXT NOT NULL CHECK (type IN ('clinical_pathway', 'program', 'checkup_pathway')),
  
  -- Content
  description_short TEXT,
  description_long  TEXT,
  tagline         TEXT,
  
  -- Structure (fasi del percorso in JSONB)
  phases          JSONB DEFAULT '[]',         -- [{name, duration, steps: [{procedure_id, test_ids}]}]
  
  -- Target
  target_audience TEXT,
  outcome_description TEXT,                   -- "Perdita 12-18 kg in 3 mesi"
  
  -- Pricing
  price_total     DECIMAL(10,2),
  price_note      TEXT,
  
  -- SEO
  seo_title       TEXT,
  seo_description TEXT,
  
  -- CTA
  cta_text        TEXT DEFAULT 'Inizia il percorso',
  cta_url         TEXT,
  cta_whatsapp    TEXT,
  
  -- Search
  search_vector   TSVECTOR,
  
  -- Meta
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'hidden')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_pathways_type ON pathways(type);
CREATE INDEX idx_pathways_status ON pathways(status);
```

## 3.2 Tabelle di Relazione (Many-to-Many)

```sql
-- Medico <-> Procedura
CREATE TABLE physician_procedures (
  physician_id    TEXT NOT NULL REFERENCES physicians(id) ON DELETE CASCADE,
  procedure_id    TEXT NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  role            TEXT CHECK (role IN ('primary', 'referente', 'senior', 'collaborator')),
  badge           TEXT,                       -- testo badge speciale
  sort_order      INTEGER DEFAULT 0,
  PRIMARY KEY (physician_id, procedure_id)
);

-- Medico <-> Percorso
CREATE TABLE physician_pathways (
  physician_id    TEXT NOT NULL REFERENCES physicians(id) ON DELETE CASCADE,
  pathway_id      TEXT NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
  role            TEXT CHECK (role IN ('lead', 'team_member', 'consultant')),
  PRIMARY KEY (physician_id, pathway_id)
);

-- Procedura <-> Percorso
CREATE TABLE procedure_pathways (
  procedure_id    TEXT NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  pathway_id      TEXT NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
  phase           TEXT,                       -- "initial", "monitoring", "advanced"
  required        BOOLEAN DEFAULT true,
  sort_order      INTEGER DEFAULT 0,
  PRIMARY KEY (procedure_id, pathway_id)
);

-- Esame Lab <-> Pack
CREATE TABLE test_packs (
  test_id         TEXT NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  pack_id         TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  quantity        INTEGER DEFAULT 1,
  sort_order      INTEGER DEFAULT 0,
  PRIMARY KEY (test_id, pack_id)
);

-- Esame Lab <-> Percorso
CREATE TABLE test_pathways (
  test_id         TEXT NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  pathway_id      TEXT NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
  phase           TEXT,
  quantity        INTEGER DEFAULT 1,
  PRIMARY KEY (test_id, pathway_id)
);

-- Pack <-> Specialità (opzionale, per filtri)
CREATE TABLE pack_specialties (
  pack_id         TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  specialty_id    TEXT NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  PRIMARY KEY (pack_id, specialty_id)
);

-- Percorso <-> Specialità
CREATE TABLE pathway_specialties (
  pathway_id      TEXT NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
  specialty_id    TEXT NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  PRIMARY KEY (pathway_id, specialty_id)
);
```

## 3.3 Tabelle Operative (Admin)

```sql
-- Contatti/Lead ricevuti dal form
CREATE TABLE contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         TEXT UNIQUE,                -- ID generato dal form
  
  -- Dati contatto
  name            TEXT NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  
  -- Richiesta
  service         TEXT,                       -- "Slim Care", "Ginecologia", etc.
  message         TEXT,
  
  -- Tracking
  source_page     TEXT,                       -- URL pagina di origine
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  device_type     TEXT,
  referrer        TEXT,
  
  -- CGE Tracking
  cge_specialty   TEXT,
  cge_physician   TEXT,
  
  -- Gestione
  status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'completed', 'lost', 'spam')),
  assigned_to     UUID REFERENCES auth.users(id),
  notes           TEXT,
  follow_up_date  DATE,
  
  -- Meta
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_created ON contacts(created_at DESC);
CREATE INDEX idx_contacts_service ON contacts(service);

-- Impostazioni sito (key-value)
CREATE TABLE settings (
  key             TEXT PRIMARY KEY,
  value           JSONB NOT NULL,
  category        TEXT NOT NULL DEFAULT 'general',
  description     TEXT,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_by      UUID REFERENCES auth.users(id)
);

-- Audit log admin (immutabile)
CREATE TABLE admin_audit_log (
  id              BIGSERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id),
  user_email      TEXT NOT NULL,
  action          TEXT NOT NULL,              -- "physician.create", "lab_test.update_price"
  entity_type     TEXT NOT NULL,              -- "physician", "lab_test", "pack", etc.
  entity_id       TEXT,
  old_value       JSONB,
  new_value       JSONB,
  ip_address      INET,
  user_agent      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user ON admin_audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON admin_audit_log(created_at DESC);

-- Prenotazioni aggregate (VIEW su D1 sync)
-- Le prenotazioni restano su D1, ma sincronizziamo una vista in Supabase
-- per averle nel pannello admin senza doppia query
CREATE TABLE bookings_sync (
  id              TEXT PRIMARY KEY,
  transaction_id  TEXT UNIQUE,
  
  -- Paziente
  patient_name    TEXT NOT NULL,
  patient_phone   TEXT NOT NULL,
  patient_email   TEXT,
  patient_fiscal_code TEXT,
  
  -- Prenotazione
  service_id      TEXT,
  service_name    TEXT,
  booking_date    DATE NOT NULL,
  booking_time    TIME NOT NULL,
  
  -- Gestione
  status          TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'completed', 'cancelled', 'no_show')),
  notes           TEXT,
  
  -- Tracking
  source          TEXT,                       -- "web", "phone", "walk-in"
  gclid           TEXT,
  
  -- Meta
  synced_at       TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_date ON bookings_sync(booking_date);
CREATE INDEX idx_bookings_status ON bookings_sync(status);
```

## 3.4 Trigger e Funzioni

```sql
-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applicare a tutte le tabelle editabili
CREATE TRIGGER tr_specialties_updated BEFORE UPDATE ON specialties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_physicians_updated BEFORE UPDATE ON physicians
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_procedures_updated BEFORE UPDATE ON procedures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_lab_tests_updated BEFORE UPDATE ON lab_tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_packs_updated BEFORE UPDATE ON packs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_pathways_updated BEFORE UPDATE ON pathways
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_contacts_updated BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-update search_vector
CREATE OR REPLACE FUNCTION update_search_vector_physicians()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector = 
    setweight(to_tsvector('italian', COALESCE(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.job_title, '')), 'B') ||
    setweight(to_tsvector('italian', COALESCE(NEW.bio_short, '')), 'C') ||
    setweight(to_tsvector('italian', COALESCE(array_to_string(NEW.symptoms, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_physicians_search BEFORE INSERT OR UPDATE ON physicians
  FOR EACH ROW EXECUTE FUNCTION update_search_vector_physicians();

-- Simili per specialties, procedures, lab_tests
-- (Omesso per brevità — stessa logica con campi appropriati)

-- Audit trigger generico
CREATE OR REPLACE FUNCTION audit_log_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO admin_audit_log (user_id, user_email, action, entity_type, entity_id, old_value, new_value)
    VALUES (
      COALESCE(current_setting('app.current_user_id', true)::UUID, '00000000-0000-0000-0000-000000000000'),
      COALESCE(current_setting('app.current_user_email', true), 'system'),
      TG_TABLE_NAME || '.' || TG_OP,
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END,
      row_to_json(OLD),
      row_to_json(NEW)
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

## 3.5 Stima Volumetrica

| Tabella | Record Previsti | Crescita/Anno | Stima KB |
|---------|----------------|---------------|----------|
| specialties | 31 | +2 | 15 |
| physicians | 67 | +10 | 80 |
| procedures | 678 | +50 | 400 |
| lab_tests | 1.162 | +100 | 600 |
| packs | 15 | +3 | 15 |
| pathways | 9 | +2 | 20 |
| physician_procedures | ~800 | +100 | 30 |
| physician_pathways | ~100 | +20 | 5 |
| procedure_pathways | ~120 | +30 | 5 |
| test_packs | ~200 | +50 | 8 |
| contacts | ~500/mese | ~6.000/anno | 2.000 |
| bookings_sync | ~300/mese | ~3.600/anno | 1.200 |
| admin_audit_log | ~2.000/mese | ~24.000/anno | 5.000 |
| settings | ~50 | +10 | 5 |
| **TOTALE Anno 1** | | | **~9.4 MB** |
| **TOTALE Anno 3** | | | **~25 MB** |

> ✅ Ampiamente entro il free tier Supabase (500 MB) per 3+ anni

---

# 4. MODULI ADMIN PANEL

## 4.1 Panoramica Moduli

| # | Modulo | Descrizione | Priorità | Fase |
|---|--------|-------------|----------|------|
| M1 | **Dashboard** | KPI, prenotazioni oggi, lead recenti | 🔴 Critica | 1 |
| M2 | **Specialità** | CRUD specialità, ordinamento menu | 🟡 Alta | 1 |
| M3 | **Medici** | CRUD medici, foto, bio, disponibilità | 🔴 Critica | 1 |
| M4 | **Prestazioni** | CRUD prestazioni specialistiche | 🔴 Critica | 1 |
| M5 | **Laboratorio Analisi** | CRUD 1.162 esami, prezzi, tempi referto | 🔴 Critica | 1 |
| M6 | **Pack & Check-up** | CRUD pacchetti, composizione, prezzi | 🟡 Alta | 2 |
| M7 | **Percorsi Clinici** | CRUD percorsi, fasi, team | 🟡 Alta | 2 |
| M8 | **Prenotazioni** | Visualizzazione, stato, calendario | 🔴 Critica | 1 |
| M9 | **Contatti/Lead** | Inbox lead, stato, assegnazione, follow-up | 🔴 Critica | 1 |
| M10 | **Impostazioni** | Orari, contatti, SEO globale, chiavi | 🟢 Media | 2 |
| M11 | **Build & Deploy** | Trigger rebuild sito, log deploy | 🟢 Media | 3 |
| M12 | **Audit Log** | Log immutabile azioni admin | 🟡 Alta | 1 |
| M13 | **Utenti Admin** | Gestione ruoli admin panel | 🟡 Alta | 2 |
| M14 | **Referti (Link)** | Link rapido a referti.bio-clinic.it | 🟢 Bassa | 3 |

## 4.2 Dettaglio Moduli

### M1 — Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  📊 DASHBOARD BIO-CLINIC                          [Admin ▼] │
├──────────┬──────────┬──────────┬──────────┬────────────────┤
│ 📅 Preno.│ 📩 Lead  │ 🔬 Esami │ 👨‍⚕️ Medici│ ⚡ Quick Actions│
│ Oggi: 12 │ Nuovi: 8 │ Tot:1162│ Attivi:67│ [+ Medico]     │
│ Sett: 58 │ Sett: 34 │ Aggiorn.│ Online:52│ [+ Esame]      │
│ Mese:245 │ Mese:142 │ 28/02/26│         │ [Rebuild Sito] │
└──────────┴──────────┴──────────┴──────────┴────────────────┘
│                                                              │
│  📈 Prenotazioni Ultime 30 Giorni [Grafico a barre]         │
│  📈 Lead per Servizio [Grafico a torta]                      │
│  📋 Ultime 10 Prenotazioni                                  │
│  📋 Ultimi 10 Lead                                           │
│  ⚠️ Avvisi: Medici senza foto (3), Esami senza prezzo (12)  │
└─────────────────────────────────────────────────────────────┘
```

**KPI Cards**:
- Prenotazioni: oggi / questa settimana / questo mese (da D1 sync)
- Lead: nuovi / in attesa / completati (da contacts)
- Esami laboratorio: totale attivi / ultimo aggiornamento prezzi
- Medici: attivi / con prenotazione online / senza foto

**Quick Actions**:
- Aggiungi medico
- Aggiungi esame lab
- Modifica prezzi rapida
- Trigger rebuild sito

### M3 — Gestione Medici

**Lista Medici**:
- Tabella con: Foto (thumb), Nome, Specialità, Status, Priorità, Azioni
- Filtri: per specialità, status, con/senza foto
- Ricerca full-text
- Ordinamento drag-and-drop per priorità

**Form Medico (Create/Edit)**:
```
┌─ Dati Base ──────────────────────┐
│ Titolo*: [Prof. ▼]              │
│ Nome*:   [________]             │
│ Cognome*:[________]             │
│ Specialità*: [Ginecologia ▼]    │
│ Ruolo:   [Direttore Sanitario]  │
│ Badges:  [+ Aggiungi badge]     │
└──────────────────────────────────┘
┌─ Bio ────────────────────────────┐
│ Bio breve (200 char): [_______] │
│ Bio completa (markdown): [____] │
└──────────────────────────────────┘
┌─ Foto ───────────────────────────┐
│ [📷 Upload foto]  [Anteprima]    │
│ Formato: WebP auto-resize        │
└──────────────────────────────────┘
┌─ Prenotazione ───────────────────┐
│ ☑ Prenotazione online            │
│ URL MioDottore: [______________] │
│ ☑ Numero diretto                 │
│ Disponibilità: [✓L ✓M ✓M ☐G ✓V]│
└──────────────────────────────────┘
┌─ Prestazioni ────────────────────┐
│ [Multi-select prestazioni]       │
│ Ruolo per prestazione: [▼]      │
└──────────────────────────────────┘
┌─ Percorsi ───────────────────────┐
│ [Multi-select percorsi]          │
│ Ruolo nel percorso: [▼]         │
└──────────────────────────────────┘
┌─ SEO ────────────────────────────┐
│ Meta title: [auto-generato]      │
│ Meta description: [auto-gen]     │
│ Sintomi associati: [+ Tag]       │
└──────────────────────────────────┘
┌─ Visibilità ─────────────────────┐
│ Status: [Active ▼]               │
│ ☑ Mostra in equipe               │
│ ☑ Mostra nella specialità        │
│ ☑ Widget prenotazione            │
│ ☐ Featured in homepage           │
│ Priorità: [1-100]                │
└──────────────────────────────────┘
         [Salva]  [Anteprima]  [Annulla]
```

### M5 — Laboratorio Analisi

**Lista Esami**:
- Tabella con: Nome, Categoria, Prezzo, Digiuno, Tempi Referto, Status
- Filtri: per categoria, range prezzo, digiuno richiesto
- Ricerca full-text
- **Modifica prezzo inline** (click sul prezzo → edit in-place)
- Export CSV/Excel
- Import CSV per aggiornamenti massivi

**Categorie Esami** (da `listino-processed.json`):
```
Allergologia (IgE)      ~200 esami
Biochimica clinica      ~150 esami
Ematologia              ~80 esami
Endocrinologia          ~60 esami
Infettivologia          ~100 esami
Autoimmunità            ~80 esami
Genetica                ~40 esami
Marcatori tumorali      ~20 esami
Fertilità/PMA           ~30 esami
Prenatale               ~15 esami
Microbiologia           ~50 esami
Tossicologia            ~30 esami
Altro                   ~257 esami
```

**Form Esame Lab**:
```
┌─ Dati Base ──────────────────────┐
│ Nome*:     [_________________]   │
│ Codice:    [_______]             │
│ Categoria*:[Ematologia ▼]       │
│ Sotto-cat: [________]            │
└──────────────────────────────────┘
┌─ Campione ───────────────────────┐
│ Tipo: [Sangue ▼]                │
│ Provetta: [EDTA ▼]             │
│ Volume: [5 ml]                   │
└──────────────────────────────────┘
┌─ Preparazione ───────────────────┐
│ ☑ Digiuno richiesto              │
│ Note: [8 ore minimo...]         │
└──────────────────────────────────┘
┌─ Risultati ──────────────────────┐
│ Tempo referto: [48-72h]          │
│ Range riferimento: [JSONB form]  │
└──────────────────────────────────┘
┌─ Prezzi ─────────────────────────┐
│ Prezzo standard: [€ 15.00]       │
│ Prezzo urgente:  [€ 25.00]       │
└──────────────────────────────────┘
         [Salva]  [Annulla]
```

### M8 — Prenotazioni

**Vista Prenotazioni**:
- **Calendario**: vista giornaliera/settimanale/mensile
- **Lista**: tabella con filtri per data, stato, servizio
- **Oggi**: evidenziazione prenotazioni odierne

**Dettaglio Prenotazione**:
- Dati paziente (nome, telefono, email, CF)
- Servizio prenotato
- Data/ora
- Status (confermata, completata, cancellata, no-show)
- Note operatore
- Tracking (sorgente, gclid per Google Ads)

**Fonte dati**: Sincronizzazione da Cloudflare D1 → Supabase `bookings_sync`

### M9 — Contatti / Lead

**Inbox Lead**:
- Lista cronologica con badge stato
- Filtri: stato (nuovo, contattato, schedulato, perso), servizio, data
- Assegnazione a operatore

**Dettaglio Lead**:
- Info contatto + messaggio
- Cronologia interazioni (note manuali)
- Data follow-up
- Conversione (lead → prenotazione)

**Fonte dati**: Riscrittura `/api/contact` per salvare in Supabase + invio email

---

# 5. API LAYER (Cloudflare Functions)

## 5.1 Struttura Endpoint

```
/api/admin/                              (root)
├── auth/
│   ├── POST   login                     (Supabase Auth)
│   ├── POST   logout
│   └── POST   refresh
│
├── dashboard/
│   └── GET    stats                     (KPI aggregati)
│
├── specialties/
│   ├── GET    /                          (lista)
│   ├── GET    /:id                       (dettaglio)
│   ├── POST   /                          (crea)
│   ├── PUT    /:id                       (modifica)
│   ├── DELETE /:id                       (soft delete)
│   └── PUT    /reorder                   (ordinamento)
│
├── physicians/
│   ├── GET    /                          (lista + filtri)
│   ├── GET    /:id                       (dettaglio + relazioni)
│   ├── POST   /                          (crea)
│   ├── PUT    /:id                       (modifica)
│   ├── DELETE /:id                       (soft delete)
│   ├── POST   /:id/photo                 (upload foto)
│   └── PUT    /:id/procedures            (assegna prestazioni)
│
├── procedures/
│   ├── GET    /                          (lista + filtri)
│   ├── GET    /:id                       (dettaglio)
│   ├── POST   /                          (crea)
│   ├── PUT    /:id                       (modifica)
│   └── DELETE /:id                       (soft delete)
│
├── lab-tests/
│   ├── GET    /                          (lista + filtri + paginazione)
│   ├── GET    /:id                       (dettaglio)
│   ├── POST   /                          (crea)
│   ├── PUT    /:id                       (modifica)
│   ├── PUT    /bulk-price                (aggiornamento prezzi massivo)
│   ├── POST   /import                    (import CSV)
│   ├── GET    /export                    (export CSV)
│   └── DELETE /:id                       (soft delete)
│
├── packs/
│   ├── GET    /                          (lista)
│   ├── GET    /:id                       (dettaglio + composizione)
│   ├── POST   /                          (crea)
│   ├── PUT    /:id                       (modifica)
│   ├── PUT    /:id/tests                 (modifica composizione)
│   └── DELETE /:id                       (soft delete)
│
├── pathways/
│   ├── GET    /                          (lista)
│   ├── GET    /:id                       (dettaglio + fasi)
│   ├── POST   /                          (crea)
│   ├── PUT    /:id                       (modifica)
│   └── DELETE /:id                       (soft delete)
│
├── bookings/
│   ├── GET    /                          (lista + filtri)
│   ├── GET    /calendar                  (vista calendario)
│   ├── GET    /:id                       (dettaglio)
│   ├── PUT    /:id/status                (cambia stato)
│   └── GET    /sync                      (trigger sync D1 → Supabase)
│
├── contacts/
│   ├── GET    /                          (lista lead)
│   ├── GET    /:id                       (dettaglio)
│   ├── PUT    /:id                       (aggiorna stato/note)
│   ├── PUT    /:id/assign                (assegna operatore)
│   └── GET    /stats                     (statistiche lead)
│
├── settings/
│   ├── GET    /                          (tutte le impostazioni)
│   ├── GET    /:key                      (singola impostazione)
│   └── PUT    /:key                      (modifica impostazione)
│
├── audit/
│   └── GET    /                          (log con filtri + paginazione)
│
└── build/
    ├── POST   /trigger                   (trigger rebuild sito)
    └── GET    /status                    (stato ultimo build)
```

## 5.2 Middleware Stack

```
Request
  │
  ├── 1. CORS (admin.bio-clinic.it only)
  ├── 2. Rate Limiting (KV, 100 req/min per IP)
  ├── 3. Auth Check (Supabase JWT → verify → extract user)
  ├── 4. RBAC Check (user.role in allowed_roles per route)
  ├── 5. Input Validation (Zod schemas)
  ├── 6. Handler (business logic)
  ├── 7. Audit Logger (POST/PUT/DELETE → admin_audit_log)
  └── 8. Response (standard format)
```

## 5.3 Formato Risposta Standard

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "total": 1162,
    "page": 1,
    "per_page": 50,
    "total_pages": 24
  },
  "timestamp": "2026-02-28T12:00:00Z"
}
```

Errore:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Il campo 'name' è obbligatorio",
    "details": [...]
  },
  "timestamp": "2026-02-28T12:00:00Z"
}
```

---

# 6. INVENTARIO TOKEN E CREDENZIALI

## 6.1 Token/Account GIÀ ATTIVI (da preservare)

| # | Servizio | Token/Variabile | Dove Configurato | Uso |
|---|----------|----------------|------------------|-----|
| 1 | **Supabase** | `SUPABASE_URL` | wrangler.toml (referti) | URL progetto |
| 2 | **Supabase** | `SUPABASE_ANON_KEY` | wrangler.toml (referti) | Client-side API |
| 3 | **Supabase** | `SUPABASE_SERVICE_KEY` | CF Pages Dashboard (secret) | Server-side, bypass RLS |
| 4 | **Resend** | `RESEND_API_KEY` | CF Pages Dashboard (secret) | Invio email |
| 5 | **Resend** | `EMAIL_FROM` | wrangler.toml (referti) | Mittente email |
| 6 | **Cloudflare** | D1 `BOOKING_DB` | wrangler.toml (main) | Database prenotazioni |
| 7 | **Cloudflare** | KV `BOOKING_KV` | wrangler.toml (main) | Rate limiting, cache |
| 8 | **Cloudflare** | `ALLOWED_ORIGINS` | wrangler.toml (both) | CORS whitelist |
| 9 | **Cloudflare** | `CONTACT_EMAIL` | wrangler.toml (main) | Email destinatario contatti |
| 10 | **Crypto** | `MASTER_ENCRYPTION_KEY` | CF Pages Dashboard (secret) | Crittografia 2FA/file |
| 11 | **App** | `APP_URL` | wrangler.toml (referti) | URL applicazione referti |
| 12 | **App** | `APP_ENV` | wrangler.toml (referti) | Ambiente (production) |

## 6.2 Token/Account DA CREARE per Admin Panel

| # | Servizio | Token/Variabile | Scopo | Dove Configurare |
|---|----------|----------------|-------|-----------------|
| 13 | **Cloudflare** | Nuovo progetto Pages `admin-bioclinic` | Hosting admin SPA | CF Dashboard |
| 14 | **Supabase** | Stesse chiavi (progetto condiviso) | DB condiviso con referti | Riuso esistenti |
| 15 | **Cloudflare** | `ADMIN_ALLOWED_ORIGINS` | `https://admin.bio-clinic.it` | wrangler.toml (admin) |
| 16 | **GitHub** | `CF_API_TOKEN` (GitHub Secret) | Deploy automatico admin | GitHub Repo Secrets |
| 17 | **GitHub** | `CF_ACCOUNT_ID` (GitHub Secret) | Account Cloudflare | GitHub Repo Secrets |
| 18 | **GitHub** | Webhook Secret | Trigger rebuild sito da admin | GitHub Repo Settings |
| 19 | **Supabase** | Nuovi ruoli RLS | Policy per tabelle admin | Supabase Dashboard |
| 20 | **DNS** | Record CNAME `admin.bio-clinic.it` | Puntamento a CF Pages | Cloudflare DNS |

## 6.3 Token GIÀ CONFIGURATI su Cloudflare Dashboard (Segreti)

Da verificare che siano presenti nella dashboard di Cloudflare Pages:

**Progetto `bio-clinic`** (sito principale):
- [ ] `EMAIL_API_KEY` (Resend)
- [ ] `LEADS_KV` (binding opzionale)

**Progetto `referti-bioclinic`**:
- [ ] `SUPABASE_SERVICE_KEY`
- [ ] `RESEND_API_KEY`
- [ ] `MASTER_ENCRYPTION_KEY`

**Progetto `admin-bioclinic`** (DA CREARE):
- [ ] `SUPABASE_URL` (copiare da referti)
- [ ] `SUPABASE_ANON_KEY` (copiare da referti)
- [ ] `SUPABASE_SERVICE_KEY` (copiare da referti)
- [ ] `ADMIN_JWT_SECRET` (generare nuovo)
- [ ] `ALLOWED_ORIGINS` = `https://admin.bio-clinic.it`

## 6.4 Account Esterni

| Servizio | Account | Piano | Stato |
|----------|---------|-------|-------|
| **Cloudflare** | Bio Pharma S.r.l. | Free/Pro | ✅ Attivo |
| **Supabase** | mdxqgzkxrcrotxxbhoai | Free tier | ✅ Attivo |
| **Resend** | Bio-Clinic | Free tier (100 email/giorno) | ✅ Attivo |
| **GitHub** | biopharma-italia/EXTREME-BIO | Free | ✅ Attivo |
| **Google** | GTM/GA4 (CGE v4 Enterprise) | Free | ✅ Attivo |
| **DNS** | Cloudflare DNS (bio-clinic.it) | Free | ✅ Attivo |

---

# 7. LIMITI INFRASTRUTTURALI

## 7.1 Supabase Free Tier

| Risorsa | Limite | Uso Attuale | Dopo Admin | Margine |
|---------|--------|-------------|------------|---------|
| Database | 500 MB | ~5 MB (referti) | ~15 MB | ✅ 97% libero |
| Rows | 50.000 | ~500 | ~5.000 | ✅ 90% libero |
| Auth Users | 50.000 MAU | ~100 | ~120 | ✅ Ampio |
| Storage | 1 GB | ~50 MB | ~200 MB | ✅ 80% libero |
| Edge Functions | 500K invocazioni/mese | ~10K | ~30K | ✅ 94% libero |
| Realtime | 200 connessioni | 0 | ~5 | ✅ OK |
| Bandwidth | 5 GB/mese | ~1 GB | ~2 GB | ✅ 60% libero |

## 7.2 Cloudflare Free Tier

| Risorsa | Limite | Uso Attuale | Dopo Admin | Margine |
|---------|--------|-------------|------------|---------|
| Pages Projects | 100 | 2 (bio-clinic, referti) | 3 (+admin) | ✅ 97% libero |
| Pages Builds | 500/mese | ~30 | ~50 | ✅ 90% libero |
| Functions Invocations | 100K/giorno | ~2K | ~5K | ✅ 95% libero |
| D1 Storage | 5 GB | ~1 MB | ~1 MB (invariato) | ✅ OK |
| D1 Reads | 5M/giorno | ~500 | ~500 | ✅ OK |
| KV Reads | 100K/giorno | ~1K | ~2K | ✅ 98% libero |
| KV Storage | 1 GB | ~1 MB | ~5 MB | ✅ OK |

## 7.3 Resend Free Tier

| Risorsa | Limite | Uso Attuale | Dopo Admin | Margine |
|---------|--------|-------------|------------|---------|
| Email/giorno | 100 | ~10 | ~30 | ✅ 70% libero |
| Email/mese | 3.000 | ~300 | ~900 | ✅ 70% libero |

## 7.4 GitHub Free Tier

| Risorsa | Limite | Uso Attuale | Dopo Admin |
|---------|--------|-------------|------------|
| Actions minuti | 2.000/mese | ~100 | ~200 |
| Storage | Illimitato (pubblico) | ~50 MB | ~55 MB |

> ✅ **NESSUN upgrade di piano necessario** — tutto rientra nei free tier per almeno 2-3 anni.

---

# 8. PIANO DI MIGRAZIONE DATI

## 8.1 Fonti → Destinazione

| Fonte | Formato | Destinazione DB | Script |
|-------|---------|----------------|--------|
| `specialties.yaml` (v2) | YAML, 31 spec. | `specialties` | `migrate-specialties.ts` |
| `physicians.yaml` (v2) | YAML, 67 medici | `physicians` + `physician_procedures` | `migrate-physicians.ts` |
| `procedures.yaml` (v2) | YAML, 678 prest. | `procedures` | `migrate-procedures.ts` |
| `listino-processed.json` | JSON, 1.136 esami | `lab_tests` | `migrate-lab-tests.ts` |
| `packs.json` | JSON, 12 pack | `packs` + `test_packs` | `migrate-packs.ts` |
| `pathways.json` | JSON, 12 percorsi | `pathways` + relazioni | `migrate-pathways.ts` |
| `_services-data.js` | JS, 10+ servizi | `bookings services` (D1 invariato) | Non necessario |

## 8.2 Ordine Migrazione (rispetta FK)

```
1. specialties          (nessuna dipendenza)
2. physicians           (dipende da specialties)
3. procedures           (dipende da specialties)
4. lab_tests            (nessuna dipendenza esterna)
5. packs                (nessuna dipendenza esterna)
6. pathways             (nessuna dipendenza esterna)
7. physician_procedures (dipende da physicians + procedures)
8. physician_pathways   (dipende da physicians + pathways)
9. procedure_pathways   (dipende da procedures + pathways)
10. test_packs          (dipende da lab_tests + packs)
11. test_pathways       (dipende da lab_tests + pathways)
12. settings            (seed valori iniziali)
```

## 8.3 Validazione Post-Migrazione

```
CHECK 1: Conteggio righe per tabella vs fonte
CHECK 2: Integrità FK (nessun orfano)
CHECK 3: Unicità ID e slug
CHECK 4: Status validi (enum check)
CHECK 5: Search vector popolato (NOT NULL)
CHECK 6: Prezzo esami: nessun NULL dove atteso
CHECK 7: Specialità: tutte le 31 presenti
CHECK 8: Medici: tutti i 67 presenti
CHECK 9: Cross-reference: physician_procedures coerente
CHECK 10: Full-text search: query di test restituisce risultati
```

---

# 9. PIANO IMPLEMENTAZIONE PER FASI

## Fase 0 — Preparazione (1 settimana)

| Task | Descrizione | Deliverable |
|------|-------------|-------------|
| 0.1 | Creare progetto CF Pages `admin-bioclinic` | URL: admin.bio-clinic.it |
| 0.2 | Configurare DNS CNAME | `admin.bio-clinic.it` → CF Pages |
| 0.3 | Creare branch `feature/admin-panel` | Branch protetto |
| 0.4 | Configurare tutti i token/secrets su CF Dashboard | Checklist 6.3 completata |
| 0.5 | Creare migration SQL su Supabase | Tabelle + indici + trigger |
| 0.6 | Validare schema: test migration su staging | Zero errori |

## Fase 1 — Core (3 settimane)

| Task | Moduli | Descrizione |
|------|--------|-------------|
| 1.1 | Auth | Login admin con Supabase Auth, JWT, RBAC middleware |
| 1.2 | M1 Dashboard | KPI cards, grafici, quick actions |
| 1.3 | M3 Medici | CRUD completo, upload foto, assegnazione prestazioni |
| 1.4 | M5 Laboratorio | CRUD esami, prezzi inline, import/export CSV |
| 1.5 | M8 Prenotazioni | Lista + calendario + dettaglio (read-only da D1 sync) |
| 1.6 | M9 Contatti | Inbox lead, stati, assegnazione |
| 1.7 | M12 Audit Log | Visualizzazione log immutabile |
| 1.8 | Migrazione dati | Script migrazione + validazione |

## Fase 2 — Espansione (2 settimane)

| Task | Moduli | Descrizione |
|------|--------|-------------|
| 2.1 | M2 Specialità | CRUD specialità, ordinamento menu |
| 2.2 | M4 Prestazioni | CRUD prestazioni, relazioni medici |
| 2.3 | M6 Pack | CRUD pack, composizione esami |
| 2.4 | M7 Percorsi | CRUD percorsi, fasi, team |
| 2.5 | M10 Impostazioni | Orari, contatti, SEO, config |
| 2.6 | M13 Utenti Admin | Gestione ruoli, inviti |

## Fase 3 — Automazione (2 settimane)

| Task | Moduli | Descrizione |
|------|--------|-------------|
| 3.1 | M11 Build & Deploy | Trigger GitHub Action da admin |
| 3.2 | JSON Export | API che genera i JSON statici dal DB |
| 3.3 | Schema.org Generator | Genera JSON-LD da DB per ogni pagina |
| 3.4 | Search Index Builder | Rigenera search/index.json dal DB |
| 3.5 | M14 Link Referti | Redirect a referti.bio-clinic.it |
| 3.6 | Monitoring | Alert per anomalie (prezzi a 0, medici senza specialty) |

## Fase 4 — Ottimizzazione (ongoing)

| Task | Descrizione |
|------|-------------|
| 4.1 | A/B testing prezzi |
| 4.2 | Analytics integrate nel dashboard (GA4 embed) |
| 4.3 | Notifiche push per nuovi lead |
| 4.4 | WhatsApp integration (opzionale) |
| 4.5 | AI-assisted content (descrizioni esami auto-generate) |

---

# 10. REGOLE DI VALIDAZIONE E INTEGRITÀ

## 10.1 Schema Rigido (Zod) — Esempi

```typescript
// Physician validation
const PhysicianSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).min(3).max(100),
  title: z.enum(['Prof.', 'Dott.', 'Dott.ssa']),
  first_name: z.string().min(2).max(50),
  last_name: z.string().min(2).max(50),
  specialty_id: z.string().min(3),  // FK verificato lato DB
  status: z.enum(['active', 'inactive', 'hidden']),
  bio_short: z.string().max(200).optional(),
  availability: z.array(z.enum(['Lun','Mar','Mer','Gio','Ven','Sab'])).optional(),
  priority_order: z.number().int().min(1).max(999).optional(),
});

// Lab Test validation
const LabTestSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/).min(3).max(150),
  name: z.string().min(3).max(200),
  category: z.string().min(3).max(50),
  price: z.number().min(0).max(9999.99).optional(),
  price_urgent: z.number().min(0).max(9999.99).optional(),
  fasting_required: z.boolean().default(false),
  turnaround_time: z.string().max(50).optional(),
  status: z.enum(['active', 'inactive', 'hidden']),
});

// Pack validation
const PackSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(3).max(200),
  type: z.enum(['checkup', 'screening', 'pack_lab', 'pack_specialist']),
  price_total: z.number().min(0).max(9999.99).optional(),
  status: z.enum(['active', 'inactive', 'hidden']),
});
```

## 10.2 Vincoli di Integrità

| Regola | Tabella | Tipo | Azione su violazione |
|--------|---------|------|---------------------|
| Ogni medico deve avere una specialità valida | physicians | FK | Blocco salvataggio |
| ID deve essere uno slug valido `[a-z0-9-]` | Tutte | CHECK | Blocco salvataggio |
| Prezzo non può essere negativo | lab_tests, packs | CHECK | Blocco salvataggio |
| Nessun medico con specialty inesistente | physicians | FK | CASCADE check |
| Nessuna prestazione orfana (senza specialty) | procedures | FK | CASCADE check |
| Pack deve avere almeno 1 esame | test_packs | App Logic | Warning in UI |
| Percorso deve avere almeno 1 fase | pathways | App Logic | Warning in UI |
| Email lead deve essere valida (se presente) | contacts | CHECK | Sanitize |
| Slug deve essere unico per tabella | Tutte | UNIQUE | Blocco salvataggio |
| Audit log è immutabile | admin_audit_log | No UPDATE/DELETE | Trigger BEFORE |
| Soft delete: status → 'inactive', mai DELETE | Entità principali | App Logic | Applicato in API |

## 10.3 Business Rules

| Regola | Descrizione |
|--------|-------------|
| **BR1** | Un medico non può essere cancellato se ha prenotazioni future |
| **BR2** | Un esame non può essere disattivato se è in un pack attivo |
| **BR3** | Una specialità non può essere rimossa se ha medici attivi |
| **BR4** | I prezzi del laboratorio devono essere aggiornati almeno ogni 90 giorni (alert) |
| **BR5** | Ogni modifica prezzi viene loggata nell'audit log con old/new value |
| **BR6** | Il rebuild del sito richiede conferma esplicita dall'admin |
| **BR7** | Gli export CSV non includono dati sensibili (email pazienti, CF) |

---

# 11. SICUREZZA E RBAC

## 11.1 Ruoli Admin Panel

| Ruolo | Descrizione | Accessi |
|-------|-------------|---------|
| **super_admin** | Proprietario, accesso totale | Tutto + gestione utenti + settings |
| **admin** | Gestore clinica | CRUD entità + contatti + prenotazioni |
| **editor** | Content manager | Modifica testi, bio, descrizioni (no prezzi, no delete) |
| **viewer** | Solo lettura | Dashboard + visualizzazione (no modifiche) |
| **lab_manager** | Responsabile laboratorio | CRUD esami + packs + prezzi laboratorio |

## 11.2 Matrice Permessi

| Modulo | super_admin | admin | editor | viewer | lab_manager |
|--------|:-----------:|:-----:|:------:|:------:|:-----------:|
| Dashboard | ✅ Full | ✅ Full | ✅ Read | ✅ Read | ✅ Lab only |
| Specialità | ✅ CRUD | ✅ CRUD | ✅ Edit | 👁️ View | ❌ |
| Medici | ✅ CRUD | ✅ CRUD | ✅ Edit | 👁️ View | ❌ |
| Prestazioni | ✅ CRUD | ✅ CRUD | ✅ Edit | 👁️ View | ❌ |
| Lab Analisi | ✅ CRUD | ✅ CRUD | 👁️ View | 👁️ View | ✅ CRUD |
| Pack | ✅ CRUD | ✅ CRUD | 👁️ View | 👁️ View | ✅ CRUD |
| Percorsi | ✅ CRUD | ✅ CRUD | ✅ Edit | 👁️ View | ❌ |
| Prenotazioni | ✅ Full | ✅ Full | 👁️ View | 👁️ View | ❌ |
| Contatti | ✅ Full | ✅ Full | 👁️ View | ❌ | ❌ |
| Impostazioni | ✅ Full | ✅ Full | ❌ | ❌ | ❌ |
| Build & Deploy | ✅ Full | ✅ Trigger | ❌ | ❌ | ❌ |
| Audit Log | ✅ Full | ✅ View | ❌ | ❌ | ❌ |
| Utenti Admin | ✅ Full | ❌ | ❌ | ❌ | ❌ |

## 11.3 RLS Policies (Supabase)

```sql
-- Esempio: solo admin/super_admin possono scrivere su specialties
ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage specialties"
  ON specialties FOR ALL
  USING (
    (SELECT role FROM auth.users WHERE id = auth.uid())
    IN ('admin', 'super_admin')
  );

CREATE POLICY "Anyone can read active specialties"
  ON specialties FOR SELECT
  USING (status = 'active');

-- Esempio: lab_manager può gestire solo lab_tests e packs
CREATE POLICY "Lab manager can manage lab_tests"
  ON lab_tests FOR ALL
  USING (
    (SELECT role FROM auth.users WHERE id = auth.uid())
    IN ('admin', 'super_admin', 'lab_manager')
  );
```

## 11.4 Protezioni Aggiuntive

| Protezione | Implementazione |
|------------|----------------|
| **CSRF** | Token nel header `X-CSRF-Token` |
| **Rate Limiting** | 100 req/min per IP (KV) |
| **Brute Force Login** | 5 tentativi → blocco 15 min |
| **Session Timeout** | 8 ore inattività → logout |
| **IP Whitelist** (opzionale) | Limitare accesso admin a IP noti |
| **2FA** (opzionale) | TOTP per super_admin |
| **Audit Trail** | Ogni azione registrata, immutabile |
| **Input Sanitization** | Zod + DOMPurify per markdown |

---

# 12. CHECKLIST PRE-IMPLEMENTAZIONE

## 12.1 Prerequisiti Tecnici

- [ ] **Cloudflare**: Creare progetto Pages `admin-bioclinic`
- [ ] **DNS**: Aggiungere CNAME `admin.bio-clinic.it` → CF Pages
- [ ] **Supabase**: Eseguire migration SQL (tutte le tabelle)
- [ ] **Supabase**: Configurare RLS policies
- [ ] **Supabase**: Creare utente admin iniziale
- [ ] **CF Dashboard**: Configurare env vars per progetto admin
- [ ] **GitHub**: Configurare secrets per CI/CD admin
- [ ] **GitHub**: Creare workflow deploy admin

## 12.2 Decisioni da Confermare

- [ ] **Framework frontend Admin**: React (Vite) | Svelte | Astro + React
  - **Raccomandazione**: React + Vite + Tailwind (ecosistema più ampio, shadcn/ui per componenti)
- [ ] **Deployment admin**: Stesso repo (monorepo) o repo separato?
  - **Raccomandazione**: Stesso repo, cartella `/admin` (come `/referti`)
- [ ] **Primo utente admin**: Email e ruolo per setup iniziale
- [ ] **Dominio admin**: `admin.bio-clinic.it` confermato?

## 12.3 Dati da Raccogliere

- [ ] **Listino completo**: Verificare che `listino-processed.json` (1.136 esami) sia aggiornato
- [ ] **Medici**: Verificare lista completa 67 medici con specialità corrette
- [ ] **Foto medici**: Raccogliere foto mancanti (formato WebP, min 400x400)
- [ ] **Categorie esami**: Confermare tassonomia categorie laboratorio
- [ ] **Prezzi pack**: Verificare/aggiornare prezzi pacchetti

## 12.4 Rischi e Mitigazioni

| Rischio | Probabilità | Impatto | Mitigazione |
|---------|-------------|---------|-------------|
| Supabase free tier insufficiente | Bassa | Alto | Monitoraggio mensile, piano upgrade predisposto |
| Migrazione dati con errori | Media | Alto | Script idempotenti, validazione post-migrazione, rollback SQL |
| Interruzione sito durante migrazione | Bassa | Critico | Le pagine HTML restano statiche, nessun downtime |
| Token esposti | Bassa | Critico | Tutti i secrets su CF Dashboard, mai in codice |
| Conflitto referti/admin su stesso DB | Bassa | Medio | Schema separati, RLS policy distinte |

---

# APPENDICE A — Tecnologie Raccomandate

## Frontend Admin Panel

| Componente | Tecnologia | Motivazione |
|------------|-----------|-------------|
| Framework | **React 18 + Vite** | Ecosistema ampio, TypeScript nativo |
| UI Library | **shadcn/ui + Tailwind CSS** | Componenti accessibili, personalizzabili |
| State | **TanStack Query v5** | Cache, invalidazione, optimistic updates |
| Routing | **TanStack Router** o React Router | Type-safe routing |
| Forms | **React Hook Form + Zod** | Validazione type-safe |
| Tabelle | **TanStack Table** | Sorting, filtering, pagination |
| Grafici | **Recharts** o **Chart.js** | Dashboard KPI |
| Rich Text | **TipTap** (markdown) | Editor bio medici |
| Date | **date-fns** | Gestione date/orari |
| Upload | **Supabase Storage SDK** | Upload foto medici |
| Icons | **Lucide React** | Iconset coerente |

## Backend

| Componente | Tecnologia |
|------------|-----------|
| Runtime | Cloudflare Pages Functions (Workers) |
| Language | TypeScript |
| Validation | Zod |
| Auth | Supabase Auth + JWT |
| Database | Supabase PostgreSQL (PostgREST + custom SQL) |
| Email | Resend API |
| Storage | Supabase Storage (foto medici) |

---

# APPENDICE B — Struttura File Progetto

```
bio-clinic/
├── admin/                          ← NUOVO
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── wrangler.toml               ← Config CF Pages per admin
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── routes/                  ← Pagine admin
│   │   │   ├── login.tsx
│   │   │   ├── dashboard.tsx
│   │   │   ├── physicians/
│   │   │   │   ├── index.tsx        (lista)
│   │   │   │   └── [id].tsx         (dettaglio/edit)
│   │   │   ├── lab-tests/
│   │   │   │   ├── index.tsx
│   │   │   │   └── [id].tsx
│   │   │   ├── procedures/
│   │   │   ├── packs/
│   │   │   ├── pathways/
│   │   │   ├── specialties/
│   │   │   ├── bookings/
│   │   │   ├── contacts/
│   │   │   ├── settings/
│   │   │   └── audit/
│   │   ├── components/
│   │   │   ├── ui/                  (shadcn/ui)
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── dashboard/
│   │   │   ├── physicians/
│   │   │   ├── lab-tests/
│   │   │   └── shared/
│   │   ├── lib/
│   │   │   ├── supabase.ts
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── types.ts
│   │   │   └── validators.ts        (Zod schemas)
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── usePhysicians.ts
│   │   │   └── useLabTests.ts
│   │   └── styles/
│   │       └── globals.css
│   ├── functions/                   ← API admin
│   │   └── api/
│   │       └── admin/
│   │           ├── _middleware.ts
│   │           ├── auth/
│   │           ├── dashboard/
│   │           ├── physicians/
│   │           ├── lab-tests/
│   │           ├── procedures/
│   │           ├── packs/
│   │           ├── pathways/
│   │           ├── bookings/
│   │           ├── contacts/
│   │           ├── settings/
│   │           ├── audit/
│   │           └── build/
│   └── scripts/
│       ├── migrate-specialties.ts
│       ├── migrate-physicians.ts
│       ├── migrate-procedures.ts
│       ├── migrate-lab-tests.ts
│       ├── migrate-packs.ts
│       ├── migrate-pathways.ts
│       ├── validate-migration.ts
│       └── export-json.ts          ← Genera JSON statici dal DB
│
├── site/                            ← INVARIATO
│   ├── data/                        ← Continua a servire come cache statica
│   │   ├── entities/                ← Rigenerato dal DB via export-json.ts
│   │   └── search/                  ← Rigenerato dal DB
│   └── ...339 pagine HTML...
│
├── referti/                         ← INVARIATO
│   └── ...
│
├── functions/                       ← INVARIATO (booking + contact)
│   └── api/
│       ├── booking/
│       └── contact.js
│
└── wrangler.toml                    ← INVARIATO (sito principale)
```

---

# APPENDICE C — Flusso Dati Completo

```
                    ┌──────────────┐
                    │  ADMIN PANEL │
                    │  (browser)   │
                    └──────┬───────┘
                           │ HTTPS
                           ▼
                    ┌──────────────┐
                    │  CF Pages    │
                    │  Functions   │
                    │  /api/admin  │
                    └──┬───────┬───┘
                       │       │
            ┌──────────▼──┐ ┌──▼──────────┐
            │  SUPABASE   │ │ CF D1       │
            │  PostgreSQL │ │ (Booking)   │
            │             │ │             │
            │ specialties │ │ services    │
            │ physicians  │ │ slots       │
            │ procedures  │ │ bookings    │
            │ lab_tests   │ └──────┬──────┘
            │ packs       │        │ sync
            │ pathways    │ ◄──────┘
            │ contacts    │ (bookings_sync)
            │ settings    │
            │ audit_log   │
            └──────┬──────┘
                   │
                   │ export-json.ts (on demand / scheduled)
                   ▼
            ┌──────────────┐
            │ JSON Files   │
            │ site/data/   │
            │              │
            │ entities/    │ ← Rigenerato
            │ search/      │ ← Rigenerato
            │ listino/     │ ← Rigenerato
            └──────┬───────┘
                   │
                   │ git commit + deploy
                   ▼
            ┌──────────────┐
            │ SITO STATICO │
            │ bio-clinic.it│
            │ 339 pagine   │
            │ (invariate)  │
            └──────────────┘
```

---

# APPENDICE D — Risposte API Esempio

## GET /api/admin/lab-tests?category=Ematologia&page=1&per_page=20

```json
{
  "success": true,
  "data": [
    {
      "id": "emocromo-completo",
      "name": "Emocromo Completo",
      "category": "Ematologia",
      "price": 8.00,
      "price_urgent": 15.00,
      "fasting_required": true,
      "turnaround_time": "24h",
      "status": "active",
      "updated_at": "2026-02-28T10:30:00Z"
    }
  ],
  "meta": {
    "total": 80,
    "page": 1,
    "per_page": 20,
    "total_pages": 4,
    "filters": {
      "category": "Ematologia"
    }
  }
}
```

## PUT /api/admin/lab-tests/emocromo-completo

```json
// Request
{
  "price": 10.00,
  "turnaround_time": "12h"
}

// Response
{
  "success": true,
  "data": {
    "id": "emocromo-completo",
    "name": "Emocromo Completo",
    "price": 10.00,
    "turnaround_time": "12h",
    "updated_at": "2026-02-28T10:35:00Z"
  },
  "audit": {
    "action": "lab_tests.update",
    "changes": {
      "price": { "old": 8.00, "new": 10.00 },
      "turnaround_time": { "old": "24h", "new": "12h" }
    }
  }
}
```

---

# APPENDICE E — CENTRALIZZAZIONE HEADER / FOOTER / MOBILE-NAV

## E.1 Problema Attuale: Duplicazione Critica

L'analisi del codice rivela una delle fragilita piu gravi del sito attuale:

| Metrica | Valore |
|---------|--------|
| **Pagine con header inline** | 220 su 339 |
| **Pagine con footer inline** | 215 su 339 |
| **Pagine senza header/footer** | 119 (pagine legacy/vecchie) |
| **Varianti header diverse (md5)** | **~25 varianti** |
| **Varianti footer diverse (md5)** | **~22 varianti** |
| **Righe header** | da 50 a 136 righe (varia per pagina!) |
| **Righe mobile-nav** | ~66 righe per pagina |
| **Righe footer** | da 85 a 92 righe (varia per pagina!) |
| **Peso duplicazione** | ~16 KB per pagina x 220 pagine = **~3.5 MB di HTML duplicato** |

### Cause delle varianti
- **Voci di menu diverse** tra pagine (alcune hanno dropdown piu ricchi di altre)
- **Link "active"** diverso per ogni sezione (`class="nav-link active"`)
- **Pagine create in momenti diversi** con versioni diverse del nav
- **119 pagine senza header/footer** (pagine legacy non aggiornate)

### Rischi operativi attuali
| Rischio | Impatto | Probabilita |
|---------|---------|-------------|
| Aggiungere voce menu → modificare 220+ file | **Critico** — ore di lavoro, errori certi | Ogni volta |
| Cambiare numero telefono → 220 footer da aggiornare | **Alto** — inevitabili dimenticanze | Raro |
| Link nel footer non coerenti tra pagine | **Medio** — SEO penalizzato | Gia presente |
| Pagine legacy senza nav → esperienza utente rotta | **Alto** — utente perso | Costante |
| Errore in un aggiornamento → pagine rotte | **Alto** — downtime parziale | Ad ogni modifica |

## E.2 Soluzione Architetturale: Component Injection

### Strategia scelta: Build-Time Injection (non client-side)

**Perche NON JavaScript client-side (fetch + innerHTML)**:
- SEO: Google non esegue sempre JS → header/footer assenti nei crawl
- Performance: flash of unstyled content (FOUC) al caricamento
- Accessibilita: screen reader non vedono il nav prima dell'idratazione

**Perche Build-Time (scelta corretta per sito statico su Cloudflare Pages)**:
- Zero impatto SEO → HTML completo nel sorgente
- Zero impatto performance → nessun JS aggiuntivo
- Compatibile con Cloudflare Pages (static site)
- Header/footer nel HTML servito → cache CDN perfetta

### Componenti da centralizzare

```
site/
├── _components/                    ← NUOVO: Sorgenti unici
│   ├── header.html                 ← Header desktop (1 file)
│   ├── mobile-nav.html             ← Menu mobile (1 file)
│   ├── footer.html                 ← Footer (1 file)
│   ├── search-panel.html           ← Pannello ricerca (1 file)
│   └── consent-banner.html         ← Cookie banner (1 file, se presente)
│
├── scripts/
│   └── inject-components.ts        ← Script build-time
│
└── *.html                          ← Pagine con placeholder
```

### Formato placeholder nelle pagine HTML

```html
<!DOCTYPE html>
<html lang="it">
<head>...</head>
<body>

  <!-- BC:HEADER -->
  <!-- /BC:HEADER -->

  <!-- BC:MOBILE-NAV -->
  <!-- /BC:MOBILE-NAV -->

  <main id="main-content">
    <!-- Contenuto specifico della pagina (INVARIATO) -->
  </main>

  <!-- BC:FOOTER -->
  <!-- /BC:FOOTER -->

  <!-- BC:SEARCH-PANEL -->
  <!-- /BC:SEARCH-PANEL -->

</body>
</html>
```

### Script Build: `inject-components.ts`

Logica:
1. Legge i file da `_components/`
2. Per ogni pagina `.html`:
   - Sostituisce `<!-- BC:HEADER -->...<!-- /BC:HEADER -->` con il contenuto di `header.html`
   - Gestisce la classe `active` sul nav-link in base al path della pagina
   - Sostituisce footer, mobile-nav, search-panel analogamente
3. Output: pagine HTML complete e pronte per deploy

### Gestione dell'active state nel menu

Lo script di injection determina automaticamente quale voce di menu e attiva:

```typescript
const NAV_ACTIVE_MAP: Record<string, string> = {
  '/':                    'Home',
  '/slim-care/':          'Slim Care Medical',
  '/slim-care-donna/':    'Slim Care Medical',
  '/screening-inps/':     'Slim Care Medical',
  '/laboratorio/':        'Laboratorio',
  '/medicina-del-lavoro/': 'Aziende',
  '/ginecologia/':        'Donna & PMA',
  '/pma-fertilita/':      'Donna & PMA',
  '/cardiologia/':        'Specialisti',
  '/endocrinologia/':     'Specialisti',
  '/dermatologia/':       'Specialisti',
  '/specialita/':         'Specialisti',
  '/equipe/':             'Specialisti',
  '/shop/':               'Medical Shop',
  '/salute/':             'Salute',
  '/contatti/':           'Contatti',
};
// Fallback: se il path non corrisponde → nessun active
```

## E.3 Gestione dal Pannello Admin

### Modulo M10 (Impostazioni) — Sottosezione "Layout Sito"

Dall'Admin Panel si potra:

| Azione | Dove si modifica | Effetto |
|--------|-----------------|---------|
| Modificare voci di menu | `settings.nav_menu` (JSONB in DB) | Rigenera `header.html` |
| Cambiare numero telefono | `settings.phone_primary` | Rigenera header + footer |
| Aggiungere badge "NEW" a voce menu | `settings.nav_menu[i].badge` | Rigenera header |
| Modificare link footer | `settings.footer_links` (JSONB in DB) | Rigenera `footer.html` |
| Aggiornare social links | `settings.social_links` | Rigenera footer |
| Cambiare orari | `settings.opening_hours` | Rigenera footer |

### Tabella `settings` — Chiavi per Layout

```sql
INSERT INTO settings (key, value, category) VALUES
('nav_menu', '[
  {"label":"Home","href":"/","type":"link"},
  {"label":"Slim Care Medical","type":"dropdown","items":[
    {"label":"Slim Care","href":"/slim-care/","icon":"heart-green"},
    {"label":"Slim Care Donna","href":"/slim-care-donna/","icon":"heart-pink"},
    {"divider":true},
    {"label":"Screening INPS","href":"/screening-inps/","badge":"NEW","style":"highlight-blue"},
    {"label":"Convenzioni Fondi","href":"/convenzioni/","style":"highlight-green"}
  ]},
  {"label":"Laboratorio","type":"dropdown","items":[
    {"label":"Laboratorio Analisi","href":"/laboratorio/","icon":"microscope"},
    {"label":"Genetica & DNA","href":"/genetica/","badge":"NEW","style":"highlight-indigo"},
    {"divider":true},
    {"label":"Preparazione Esami","href":"/preparazione-esami/","icon":"clipboard"}
  ]}
]', 'layout'),

('footer_links', '{
  "percorsi":["Slim Care|/slim-care/","Slim Care Donna|/slim-care-donna/","PMA / Fertilita|/pma-fertilita/","Cardiovascolare|/cardiologia/","Convenzioni|/convenzioni/","Prevenzione|/prevenzione/","Chi Siamo|/chi-siamo/"],
  "specialita":["Ginecologia|/ginecologia/","Cardiologia|/cardiologia/","Endocrinologia|/endocrinologia/","Laboratorio|/laboratorio/","Tutte le Specialita|/specialita/","Screening INPS|/screening-inps-sardegna/"]
}', 'layout'),

('phone_primary', '"079 956 1332"', 'contacts'),
-- RIMOSSO: phone_secondary non esiste (079 270752 inesistente)
('email_primary', '"gestione@bio-clinic.it"', 'contacts'),
('whatsapp_number', '"390799561332"', 'contacts'),
('social_facebook', '"https://www.facebook.com/bioclinicss"', 'social'),
('social_instagram', '"https://www.instagram.com/bioclinicss/"', 'social'),

('opening_hours', '[
  {"days":"Lunedi - Venerdi","hours":"07:00 - 21:00"},
  {"days":"Sabato","hours":"08:00 - 14:00"},
  {"days":"Domenica","hours":"Chiuso"}
]', 'contacts');
```

## E.4 Pipeline Completa: Modifica Menu → Sito Aggiornato

```
Admin Panel                                  Tempo
    │
    │ 1. Operatore modifica menu              ~30 sec
    │    (aggiunge voce, cambia link)
    ▼
Supabase (settings.nav_menu)                 istantaneo
    │
    │ 2. Admin clicca "Pubblica Modifiche"
    ▼
API /api/admin/build/trigger                  ~2 sec
    │
    │ 3. Genera _components/header.html
    │    Genera _components/footer.html
    │    dal DB (template + dati)
    ▼
inject-components.ts                          ~10 sec
    │
    │ 4. Inietta header/footer in 339 pagine
    │    Gestisce active state per pagina
    ▼
git commit + push → CF Pages deploy           ~60 sec
    │
    │ 5. Cloudflare CDN invalida cache
    ▼
Sito live aggiornato                          TOTALE: ~2 minuti
```

### Confronto con situazione attuale

| Operazione | OGGI (manuale) | CON ADMIN + INJECTION |
|------------|---------------|----------------------|
| Aggiungere voce menu | 2-4 ore (220 file) | **30 secondi** (1 click) |
| Cambiare telefono | 1-2 ore | **30 secondi** |
| Errori possibili | **Decine** (file dimenticati, typo) | **Zero** (1 sorgente) |
| Pagine incoerenti | **~25 varianti** | **1 variante unica** |
| Pagine senza nav | **119** | **0** (tutte le 339 coperte) |
| Rischio di rottura | **Alto** | **Nullo** (validazione pre-build) |

## E.5 Fase di Migrazione Iniziale

### Step 1: Estrarre il "header canonico" (quello della homepage, piu completo)
- 136 righe header + 66 righe mobile-nav + 92 righe footer = **294 righe** → 3 file componente

### Step 2: Script one-shot per inserire placeholder
Per ciascuna delle 339 pagine:
1. Trova `<header class="header">...` → sostituisci con `<!-- BC:HEADER -->`
2. Trova `<nav class="mobile-nav"...>...` → sostituisci con `<!-- BC:MOBILE-NAV -->`
3. Trova `<footer class="footer">...` → sostituisci con `<!-- BC:FOOTER -->`
4. Per le 119 pagine senza header: inserisci i placeholder nei punti corretti

### Step 3: Primo build con injection
- Esegui `inject-components.ts` su tutte le 339 pagine
- Verifica visivamente 10 pagine campione
- Deploy in staging → test completo

### Step 4: Deploy in produzione
- Commit + push → GitHub Actions → Cloudflare Pages

### Rischio zero: rollback istantaneo
Se qualcosa va storto, basta fare `git revert` → le pagine tornano alla versione precedente in 60 secondi.

## E.6 Integrazione nel Piano Fasi

Questa funzionalita si inserisce nella **Fase 3** (Automazione):

| Task | Fase | Descrizione |
|------|------|-------------|
| 3.0 | **Fase 3** | **Centralizzazione Header/Footer/Nav** |
| 3.0.1 | | Creare `_components/header.html`, `mobile-nav.html`, `footer.html` |
| 3.0.2 | | Creare `inject-components.ts` con active-state logic |
| 3.0.3 | | Script migrazione: sostituire inline → placeholder su 339 pagine |
| 3.0.4 | | Test in staging (10 pagine campione) |
| 3.0.5 | | Deploy in produzione |
| 3.0.6 | | Integrare gestione menu/footer in Admin M10 (Impostazioni) |

---

**FINE DOCUMENTO v1.1**

---

*Documento di architettura per Admin Panel Bio-Clinic.*  
*v1.1 — Aggiunta Appendice E: Centralizzazione Header/Footer/Nav*  
*Ogni modifica futura deve essere tracciata con numero di versione e data.*  
*Questo documento è il riferimento unico per l'implementazione.*

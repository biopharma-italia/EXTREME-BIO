-- ============================================================================
-- 001: Admin Panel Schema — Bio-Clinic
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-02-28
-- Description: Complete schema for Admin Panel entities, relationships,
--              search vectors, audit trail, and operational tables.
-- Depends on: Extensions uuid-ossp, pgcrypto, citext (from referti 001)
-- ============================================================================

-- Enable Italian full-text search configuration if not exists
-- (Supabase provides 'italian' config by default via pg_catalog)

-- ============================================================================
-- SECTION 1: ENUM TYPES
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE entity_status AS ENUM ('active', 'inactive', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE physician_title AS ENUM ('Prof.', 'Dott.', 'Dott.ssa');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE procedure_category AS ENUM (
    'visita', 'diagnostica', 'esame', 'trattamento', 'intervento', 'terapia'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE page_type AS ENUM ('A', 'B', 'C', 'D');
  -- A = Dedicated page, B = Hub aggregate, C = Pathway only, D = Price list only
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pathway_type AS ENUM ('clinical_pathway', 'program', 'checkup_pathway');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pack_type AS ENUM ('checkup', 'screening', 'pack_lab', 'pack_specialist');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE contact_status AS ENUM (
    'new', 'contacted', 'scheduled', 'completed', 'lost', 'spam'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'confirmed', 'completed', 'cancelled', 'no_show'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE physician_role AS ENUM (
    'primary', 'referente', 'senior', 'collaborator'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE pathway_member_role AS ENUM ('lead', 'team_member', 'consultant');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 2: ENTITY TABLES
-- ============================================================================

-- -------------------------------------------------------
-- Table: specialties
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS specialties (
  id                TEXT PRIMARY KEY,               -- slug: "ginecologia"
  name              TEXT NOT NULL,                   -- "Ginecologia e Ostetricia"
  name_extended     TEXT,                            -- nome completo
  slug              TEXT NOT NULL UNIQUE,             -- URL slug
  parent_id         TEXT REFERENCES specialties(id) ON DELETE SET NULL,

  -- Display
  icon              TEXT,                            -- emoji or icon class
  color_primary     TEXT,                            -- "#E91E63"
  color_dark        TEXT,
  color_light       TEXT,

  -- Content
  description_short TEXT,                            -- max ~200 chars
  description_long  TEXT,                            -- markdown

  -- Page Config (flexible JSONB for section configuration)
  page_config       JSONB DEFAULT '{}',

  -- Visibility & Ordering
  show_in_menu      BOOLEAN NOT NULL DEFAULT true,
  show_in_homepage  BOOLEAN NOT NULL DEFAULT false,
  featured          BOOLEAN NOT NULL DEFAULT false,
  menu_order        INTEGER NOT NULL DEFAULT 100,

  -- SEO
  seo_title         TEXT,
  seo_description   TEXT,
  seo_keywords      TEXT[] DEFAULT '{}',

  -- Full-text search
  search_vector     TSVECTOR,

  -- Meta
  status            entity_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_specialties_slug ON specialties(slug);
CREATE INDEX IF NOT EXISTS idx_specialties_status ON specialties(status);
CREATE INDEX IF NOT EXISTS idx_specialties_menu_order ON specialties(menu_order);
CREATE INDEX IF NOT EXISTS idx_specialties_parent ON specialties(parent_id);
CREATE INDEX IF NOT EXISTS idx_specialties_search ON specialties USING GIN(search_vector);

-- -------------------------------------------------------
-- Table: physicians
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS physicians (
  id                TEXT PRIMARY KEY,               -- slug: "salvatore-dessole"
  title             physician_title NOT NULL,
  first_name        TEXT NOT NULL,
  last_name         TEXT NOT NULL,
  -- Generated columns for display
  name              TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  display_name      TEXT GENERATED ALWAYS AS (title::TEXT || ' ' || first_name || ' ' || last_name) STORED,

  -- Primary specialty (FK)
  specialty_id      TEXT NOT NULL REFERENCES specialties(id) ON DELETE RESTRICT,
  -- Secondary specialties (logical FK array)
  specialties_secondary TEXT[] DEFAULT '{}',

  -- Professional
  job_title         TEXT,                            -- "Direttore Sanitario"
  role_badges       TEXT[] DEFAULT '{}',             -- {"Direttore Sanitario", "Prof. Emerito"}
  is_director       BOOLEAN NOT NULL DEFAULT false,

  -- Bio
  bio_short         TEXT,                            -- max ~200 chars
  bio_long          TEXT,                            -- markdown

  -- Media
  photo_url         TEXT,                            -- URL or Supabase Storage path

  -- Booking
  booking_enabled       BOOLEAN NOT NULL DEFAULT true,
  miodottore_url        TEXT,
  miodottore_id         TEXT,
  miodottore_widget_html TEXT,
  direct_phone          BOOLEAN NOT NULL DEFAULT false,
  online_booking        BOOLEAN NOT NULL DEFAULT false,

  -- Availability (days of week)
  availability      TEXT[] DEFAULT '{}',             -- {"Lun", "Mar", "Mer", "Gio", "Ven"}

  -- Symptoms matching for search
  symptoms          TEXT[] DEFAULT '{}',

  -- Publications
  publications      JSONB DEFAULT '[]',              -- [{name, url, publisher, year}]

  -- Visibility
  show_in_equipe        BOOLEAN NOT NULL DEFAULT true,
  show_in_specialty     BOOLEAN NOT NULL DEFAULT true,
  show_booking_widget   BOOLEAN NOT NULL DEFAULT true,
  featured_on_homepage  BOOLEAN NOT NULL DEFAULT false,
  priority_order        INTEGER NOT NULL DEFAULT 100,

  -- SEO
  seo_title         TEXT,
  seo_description   TEXT,
  seo_keywords      TEXT[] DEFAULT '{}',

  -- Full-text search
  search_vector     TSVECTOR,

  -- Meta
  status            entity_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_physicians_specialty ON physicians(specialty_id);
CREATE INDEX IF NOT EXISTS idx_physicians_status ON physicians(status);
CREATE INDEX IF NOT EXISTS idx_physicians_priority ON physicians(priority_order);
CREATE INDEX IF NOT EXISTS idx_physicians_search ON physicians USING GIN(search_vector);

-- -------------------------------------------------------
-- Table: procedures
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS procedures (
  id                TEXT PRIMARY KEY,               -- slug: "visita-ginecologica"
  name              TEXT NOT NULL,
  name_extended     TEXT,
  slug              TEXT NOT NULL UNIQUE,

  -- Classification
  specialty_id      TEXT NOT NULL REFERENCES specialties(id) ON DELETE RESTRICT,
  category          procedure_category NOT NULL,
  page_type         page_type NOT NULL DEFAULT 'D',

  -- Content
  description_short TEXT,
  description_long  TEXT,                            -- markdown

  -- Clinical Info
  duration_minutes      INTEGER,
  preparation_required  BOOLEAN NOT NULL DEFAULT false,
  fasting_required      BOOLEAN NOT NULL DEFAULT false,
  preparation_notes     TEXT,
  follow_up_notes       TEXT,

  -- Indications & Contraindications
  indications       TEXT[] DEFAULT '{}',
  contraindications TEXT[] DEFAULT '{}',

  -- Related (logical FK arrays)
  related_procedure_ids TEXT[] DEFAULT '{}',

  -- FAQ (structured)
  faqs              JSONB DEFAULT '[]',              -- [{question, answer}]

  -- Pricing
  show_price        BOOLEAN NOT NULL DEFAULT false,
  price             DECIMAL(10,2),
  price_note        TEXT,                            -- "Da €50" / "Su preventivo"

  -- Upsell
  upsell_pack_id    TEXT,                            -- FK -> packs or pathways

  -- Search terms
  search_terms      TEXT[] DEFAULT '{}',

  -- SEO
  seo_title         TEXT,
  seo_description   TEXT,
  schema_org_type   TEXT DEFAULT 'MedicalProcedure',

  -- Booking
  booking_priority  TEXT DEFAULT 'normal',

  -- Page URL (computed or stored)
  page_url          TEXT,

  -- Full-text search
  search_vector     TSVECTOR,

  -- Meta
  status            entity_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_procedures_slug ON procedures(slug);
CREATE INDEX IF NOT EXISTS idx_procedures_specialty ON procedures(specialty_id);
CREATE INDEX IF NOT EXISTS idx_procedures_category ON procedures(category);
CREATE INDEX IF NOT EXISTS idx_procedures_page_type ON procedures(page_type);
CREATE INDEX IF NOT EXISTS idx_procedures_status ON procedures(status);
CREATE INDEX IF NOT EXISTS idx_procedures_search ON procedures USING GIN(search_vector);

-- -------------------------------------------------------
-- Table: lab_tests
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS lab_tests (
  id                TEXT PRIMARY KEY,               -- slug: "emocromo-completo"
  name              TEXT NOT NULL,
  name_extended     TEXT,
  code              TEXT,                            -- nomenclatore code

  -- Classification
  category          TEXT NOT NULL,                   -- "Ematologia", "Biochimica", etc.
  subcategory       TEXT,
  body_system       TEXT,                            -- "sangue", "fegato", etc.

  -- Sample
  sample_type       TEXT,                            -- "sangue_venoso", "urine", "tampone"
  tube_type         TEXT,
  sample_volume     TEXT,

  -- Aliases (for search)
  aliases           TEXT[] DEFAULT '{}',

  -- Preparation
  fasting_required  BOOLEAN NOT NULL DEFAULT false,
  fasting_hours     INTEGER DEFAULT 0,
  preparation_notes TEXT,

  -- Results
  turnaround_time   TEXT,                            -- "24h", "48-72h", "7 giorni"
  reference_ranges  JSONB DEFAULT '{}',

  -- Content
  description_short TEXT,
  description_long  TEXT,
  indications       TEXT[] DEFAULT '{}',

  -- Pricing
  price             DECIMAL(10,2),
  price_urgent      DECIMAL(10,2),

  -- Upsell
  upsell_pack       TEXT,                            -- e.g. "donna-over40"

  -- Related (logical FK array)
  related_test_ids  TEXT[] DEFAULT '{}',

  -- Symptoms (for search matching)
  symptoms          TEXT[] DEFAULT '{}',

  -- Full-text search
  search_vector     TSVECTOR,

  -- Meta
  status            entity_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_lab_tests_category ON lab_tests(category);
CREATE INDEX IF NOT EXISTS idx_lab_tests_status ON lab_tests(status);
CREATE INDEX IF NOT EXISTS idx_lab_tests_price ON lab_tests(price);
CREATE INDEX IF NOT EXISTS idx_lab_tests_code ON lab_tests(code) WHERE code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_lab_tests_search ON lab_tests USING GIN(search_vector);

-- -------------------------------------------------------
-- Table: packs
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS packs (
  id                TEXT PRIMARY KEY,               -- slug: "checkup-base"
  name              TEXT NOT NULL,
  name_extended     TEXT,
  slug              TEXT NOT NULL UNIQUE,

  -- Type
  type              pack_type NOT NULL DEFAULT 'checkup',
  category          TEXT,                            -- "prevenzione", "donna", "uomo"

  -- Content
  description_short TEXT,
  description_long  TEXT,
  tagline           TEXT,
  clinical_benefit  TEXT,
  clinical_rationale TEXT,
  value_proposition TEXT,

  -- Target
  target_audience   TEXT,
  target_conditions TEXT[] DEFAULT '{}',

  -- Included exams (logical FK array — for display/search; M:N table is source of truth)
  exams_included    TEXT[] DEFAULT '{}',
  exams_count       INTEGER DEFAULT 0,

  -- Preparation summary
  preparation_summary JSONB DEFAULT '{}',

  -- Pricing
  price_total       DECIMAL(10,2),
  price_single_sum  DECIMAL(10,2),                   -- sum of individual prices
  price_note        TEXT,
  discount_pct      DECIMAL(5,2),
  savings_pct       INTEGER,

  -- SEO
  seo_title         TEXT,
  seo_description   TEXT,

  -- CTA
  cta_text          TEXT DEFAULT 'Prenota',
  cta_url           TEXT,
  cta_phone         TEXT,

  -- Page URL
  page_url          TEXT,

  -- Full-text search
  search_vector     TSVECTOR,

  -- Meta
  status            entity_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_packs_type ON packs(type);
CREATE INDEX IF NOT EXISTS idx_packs_slug ON packs(slug);
CREATE INDEX IF NOT EXISTS idx_packs_status ON packs(status);

-- -------------------------------------------------------
-- Table: pathways
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS pathways (
  id                TEXT PRIMARY KEY,               -- slug: "slim-care"
  name              TEXT NOT NULL,
  name_extended     TEXT,
  name_short        TEXT,
  slug              TEXT NOT NULL UNIQUE,

  -- Type
  type              pathway_type NOT NULL DEFAULT 'clinical_pathway',

  -- Content
  description_short TEXT,
  description_long  TEXT,
  tagline           TEXT,
  clinical_benefit  TEXT,

  -- Target
  target_audience   TEXT,
  outcome_description TEXT,

  -- Duration
  duration          TEXT,                            -- "3 mesi"
  expected_outcome  TEXT,

  -- Flagship / Priority
  is_flagship       BOOLEAN NOT NULL DEFAULT false,
  priority_score    INTEGER NOT NULL DEFAULT 0,

  -- Aliases / Keywords
  aliases           TEXT[] DEFAULT '{}',
  symptom_keywords  TEXT[] DEFAULT '{}',
  icon              TEXT,

  -- Included procedures & tests (denormalized for display)
  includes          JSONB DEFAULT '{}',              -- {procedures: [], tests: []}

  -- Phases (structured JSONB)
  phases            JSONB DEFAULT '[]',

  -- Pricing
  price_total       DECIMAL(10,2),
  price_note        TEXT,

  -- SEO
  seo_title         TEXT,
  seo_description   TEXT,

  -- CTA
  cta_text          TEXT DEFAULT 'Inizia il percorso',
  cta_url           TEXT,
  cta_whatsapp      TEXT,

  -- Page URL
  page_url          TEXT,

  -- Full-text search
  search_vector     TSVECTOR,

  -- Meta
  status            entity_status NOT NULL DEFAULT 'active',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pathways_type ON pathways(type);
CREATE INDEX IF NOT EXISTS idx_pathways_slug ON pathways(slug);
CREATE INDEX IF NOT EXISTS idx_pathways_status ON pathways(status);
CREATE INDEX IF NOT EXISTS idx_pathways_flagship ON pathways(is_flagship) WHERE is_flagship = true;


-- ============================================================================
-- SECTION 3: RELATIONSHIP TABLES (Many-to-Many)
-- ============================================================================

-- Physician <-> Procedure
CREATE TABLE IF NOT EXISTS physician_procedures (
  physician_id      TEXT NOT NULL REFERENCES physicians(id) ON DELETE CASCADE,
  procedure_id      TEXT NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  role              physician_role DEFAULT 'primary',
  badge             TEXT,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (physician_id, procedure_id)
);

CREATE INDEX IF NOT EXISTS idx_pp_procedure ON physician_procedures(procedure_id);

-- Physician <-> Pathway
CREATE TABLE IF NOT EXISTS physician_pathways (
  physician_id      TEXT NOT NULL REFERENCES physicians(id) ON DELETE CASCADE,
  pathway_id        TEXT NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
  role              pathway_member_role DEFAULT 'team_member',
  PRIMARY KEY (physician_id, pathway_id)
);

CREATE INDEX IF NOT EXISTS idx_ppw_pathway ON physician_pathways(pathway_id);

-- Procedure <-> Pathway
CREATE TABLE IF NOT EXISTS procedure_pathways (
  procedure_id      TEXT NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  pathway_id        TEXT NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
  phase             TEXT,
  required          BOOLEAN NOT NULL DEFAULT true,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (procedure_id, pathway_id)
);

CREATE INDEX IF NOT EXISTS idx_prpw_pathway ON procedure_pathways(pathway_id);

-- Lab Test <-> Pack
CREATE TABLE IF NOT EXISTS test_packs (
  test_id           TEXT NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  pack_id           TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  quantity          INTEGER NOT NULL DEFAULT 1,
  sort_order        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (test_id, pack_id)
);

CREATE INDEX IF NOT EXISTS idx_tp_pack ON test_packs(pack_id);

-- Lab Test <-> Pathway
CREATE TABLE IF NOT EXISTS test_pathways (
  test_id           TEXT NOT NULL REFERENCES lab_tests(id) ON DELETE CASCADE,
  pathway_id        TEXT NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
  phase             TEXT,
  quantity          INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (test_id, pathway_id)
);

CREATE INDEX IF NOT EXISTS idx_tpw_pathway ON test_pathways(pathway_id);

-- Pack <-> Specialty
CREATE TABLE IF NOT EXISTS pack_specialties (
  pack_id           TEXT NOT NULL REFERENCES packs(id) ON DELETE CASCADE,
  specialty_id      TEXT NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  PRIMARY KEY (pack_id, specialty_id)
);

-- Pathway <-> Specialty
CREATE TABLE IF NOT EXISTS pathway_specialties (
  pathway_id        TEXT NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
  specialty_id      TEXT NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
  PRIMARY KEY (pathway_id, specialty_id)
);


-- ============================================================================
-- SECTION 4: OPERATIONAL TABLES
-- ============================================================================

-- -------------------------------------------------------
-- Table: contacts (lead/form submissions)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           TEXT UNIQUE,

  -- Contact data
  name              TEXT NOT NULL,
  phone             TEXT NOT NULL,
  email             TEXT,

  -- Request
  service           TEXT,
  message           TEXT,

  -- Tracking
  source_page       TEXT,
  utm_source        TEXT,
  utm_medium        TEXT,
  utm_campaign      TEXT,
  device_type       TEXT,
  referrer          TEXT,

  -- CGE Tracking
  cge_specialty     TEXT,
  cge_physician     TEXT,

  -- Management
  status            contact_status NOT NULL DEFAULT 'new',
  assigned_to       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes             TEXT,
  follow_up_date    DATE,

  -- Meta
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contacts_service ON contacts(service);
CREATE INDEX IF NOT EXISTS idx_contacts_follow_up ON contacts(follow_up_date)
  WHERE follow_up_date IS NOT NULL AND status NOT IN ('completed', 'lost', 'spam');

-- -------------------------------------------------------
-- Table: settings (key-value site configuration)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  key               TEXT PRIMARY KEY,
  value             JSONB NOT NULL,
  category          TEXT NOT NULL DEFAULT 'general',
  description       TEXT,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- -------------------------------------------------------
-- Table: admin_audit_log (immutable audit trail)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id                BIGSERIAL PRIMARY KEY,
  user_id           UUID NOT NULL,
  user_email        TEXT NOT NULL,
  action            TEXT NOT NULL,                   -- "physicians.create", "lab_tests.update"
  entity_type       TEXT NOT NULL,
  entity_id         TEXT,
  old_value         JSONB,
  new_value         JSONB,
  ip_address        INET,
  user_agent        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON admin_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);

-- -------------------------------------------------------
-- Table: bookings_sync (D1 booking mirror for admin panel)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings_sync (
  id                TEXT PRIMARY KEY,
  transaction_id    TEXT UNIQUE,

  -- Patient
  patient_name      TEXT NOT NULL,
  patient_phone     TEXT NOT NULL,
  patient_email     TEXT,
  patient_fiscal_code TEXT,

  -- Booking
  service_id        TEXT,
  service_name      TEXT,
  booking_date      DATE NOT NULL,
  booking_time      TIME NOT NULL,

  -- Management
  status            booking_status NOT NULL DEFAULT 'confirmed',
  notes             TEXT,

  -- Tracking
  source            TEXT,                            -- "web", "phone", "walk-in"
  gclid             TEXT,

  -- Meta
  synced_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings_sync(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings_sync(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date_status ON bookings_sync(booking_date, status);


-- ============================================================================
-- SECTION 5: TRIGGERS & FUNCTIONS
-- ============================================================================

-- -------------------------------------------------------
-- Function: auto-update updated_at timestamp
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all editable entity tables
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'specialties', 'physicians', 'procedures', 'lab_tests',
    'packs', 'pathways', 'contacts', 'settings'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS tr_%I_updated ON %I; 
       CREATE TRIGGER tr_%I_updated BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION admin_update_updated_at();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- -------------------------------------------------------
-- Function: update search_vector for specialties
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_search_vector_specialties()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.name_extended, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.description_short, '')), 'B') ||
    setweight(to_tsvector('italian', COALESCE(array_to_string(NEW.seo_keywords, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_specialties_search ON specialties;
CREATE TRIGGER tr_specialties_search
  BEFORE INSERT OR UPDATE ON specialties
  FOR EACH ROW EXECUTE FUNCTION update_search_vector_specialties();

-- -------------------------------------------------------
-- Function: update search_vector for physicians
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_search_vector_physicians()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.first_name, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.last_name, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.job_title, '')), 'B') ||
    setweight(to_tsvector('italian', COALESCE(NEW.bio_short, '')), 'C') ||
    setweight(to_tsvector('italian', COALESCE(array_to_string(NEW.symptoms, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_physicians_search ON physicians;
CREATE TRIGGER tr_physicians_search
  BEFORE INSERT OR UPDATE ON physicians
  FOR EACH ROW EXECUTE FUNCTION update_search_vector_physicians();

-- -------------------------------------------------------
-- Function: update search_vector for procedures
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_search_vector_procedures()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.name_extended, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.description_short, '')), 'B') ||
    setweight(to_tsvector('italian', COALESCE(array_to_string(NEW.indications, ' '), '')), 'C') ||
    setweight(to_tsvector('italian', COALESCE(array_to_string(NEW.search_terms, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_procedures_search ON procedures;
CREATE TRIGGER tr_procedures_search
  BEFORE INSERT OR UPDATE ON procedures
  FOR EACH ROW EXECUTE FUNCTION update_search_vector_procedures();

-- -------------------------------------------------------
-- Function: update search_vector for lab_tests
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION update_search_vector_lab_tests()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.name_extended, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(array_to_string(NEW.aliases, ' '), '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.category, '')), 'B') ||
    setweight(to_tsvector('italian', COALESCE(NEW.description_short, '')), 'B') ||
    setweight(to_tsvector('italian', COALESCE(array_to_string(NEW.symptoms, ' '), '')), 'C') ||
    setweight(to_tsvector('italian', COALESCE(array_to_string(NEW.indications, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_lab_tests_search ON lab_tests;
CREATE TRIGGER tr_lab_tests_search
  BEFORE INSERT OR UPDATE ON lab_tests
  FOR EACH ROW EXECUTE FUNCTION update_search_vector_lab_tests();

-- -------------------------------------------------------
-- Function: generic audit log trigger
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_old JSONB;
  v_new JSONB;
  v_entity_id TEXT;
BEGIN
  -- Get current user from session variables (set by API middleware)
  v_user_id := COALESCE(
    current_setting('app.current_user_id', true)::UUID,
    '00000000-0000-0000-0000-000000000000'::UUID
  );
  v_user_email := COALESCE(
    current_setting('app.current_user_email', true),
    'system'
  );

  IF TG_OP = 'DELETE' THEN
    v_old := row_to_json(OLD)::JSONB;
    v_new := NULL;
    v_entity_id := OLD.id::TEXT;
  ELSIF TG_OP = 'INSERT' THEN
    v_old := NULL;
    v_new := row_to_json(NEW)::JSONB;
    v_entity_id := NEW.id::TEXT;
  ELSE -- UPDATE
    v_old := row_to_json(OLD)::JSONB;
    v_new := row_to_json(NEW)::JSONB;
    v_entity_id := NEW.id::TEXT;
  END IF;

  INSERT INTO admin_audit_log (
    user_id, user_email, action, entity_type, entity_id, old_value, new_value
  ) VALUES (
    v_user_id, v_user_email,
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    v_entity_id,
    v_old, v_new
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to all entity tables
DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'specialties', 'physicians', 'procedures', 'lab_tests',
    'packs', 'pathways', 'contacts', 'settings'
  ]) LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS tr_%I_audit ON %I;
       CREATE TRIGGER tr_%I_audit AFTER INSERT OR UPDATE OR DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION admin_audit_log_trigger();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;


-- ============================================================================
-- SECTION 6: VIEWS (Admin Dashboard)
-- ============================================================================

-- Dashboard summary counts
CREATE OR REPLACE VIEW admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM specialties WHERE status = 'active') AS active_specialties,
  (SELECT COUNT(*) FROM physicians WHERE status = 'active') AS active_physicians,
  (SELECT COUNT(*) FROM procedures WHERE status = 'active') AS active_procedures,
  (SELECT COUNT(*) FROM lab_tests WHERE status = 'active') AS active_lab_tests,
  (SELECT COUNT(*) FROM packs WHERE status = 'active') AS active_packs,
  (SELECT COUNT(*) FROM pathways WHERE status = 'active') AS active_pathways,
  (SELECT COUNT(*) FROM contacts WHERE status = 'new') AS new_contacts,
  (SELECT COUNT(*) FROM contacts WHERE created_at >= NOW() - INTERVAL '7 days') AS contacts_last_7d,
  (SELECT COUNT(*) FROM bookings_sync WHERE booking_date >= CURRENT_DATE) AS upcoming_bookings;

-- Physician with specialty name (for admin list)
CREATE OR REPLACE VIEW physicians_admin_view AS
SELECT
  p.*,
  s.name AS specialty_name,
  s.color_primary AS specialty_color,
  (SELECT COUNT(*) FROM physician_procedures pp WHERE pp.physician_id = p.id) AS procedures_count,
  (SELECT COUNT(*) FROM physician_pathways ppw WHERE ppw.physician_id = p.id) AS pathways_count
FROM physicians p
JOIN specialties s ON s.id = p.specialty_id;

-- Lab tests with pricing summary
CREATE OR REPLACE VIEW lab_tests_admin_view AS
SELECT
  lt.*,
  (SELECT COUNT(*) FROM test_packs tp WHERE tp.test_id = lt.id) AS packs_count,
  (SELECT COUNT(*) FROM test_pathways tpw WHERE tpw.test_id = lt.id) AS pathways_count
FROM lab_tests lt;

-- Contacts overview with recent activity
CREATE OR REPLACE VIEW contacts_admin_view AS
SELECT
  c.*,
  CASE
    WHEN c.created_at >= NOW() - INTERVAL '1 hour' THEN 'just_now'
    WHEN c.created_at >= NOW() - INTERVAL '24 hours' THEN 'today'
    WHEN c.created_at >= NOW() - INTERVAL '7 days' THEN 'this_week'
    ELSE 'older'
  END AS freshness
FROM contacts c
ORDER BY c.created_at DESC;


-- ============================================================================
-- SECTION 7: COMMENTS
-- ============================================================================

COMMENT ON TABLE specialties IS 'Clinical specialties (31 active). Source: site/data/entities/specialties.json';
COMMENT ON TABLE physicians IS 'Medical staff (67 active). Source: site/data/entities/physicians.json + physicians-complete.json';
COMMENT ON TABLE procedures IS 'Medical procedures (1840 target). Source: site/data/entities/procedures.json';
COMMENT ON TABLE lab_tests IS 'Laboratory tests (1136 from listino). Source: site/data/listino-processed.json + entities/tests.json';
COMMENT ON TABLE packs IS 'Lab/check-up packages (12 active). Source: site/data/entities/packs.json';
COMMENT ON TABLE pathways IS 'Clinical pathways (12 active). Source: site/data/entities/pathways.json';
COMMENT ON TABLE contacts IS 'Contact form leads. Source: /api/contact endpoint -> KV (legacy) -> this table';
COMMENT ON TABLE settings IS 'Key-value configuration store for site/admin settings';
COMMENT ON TABLE admin_audit_log IS 'Immutable audit trail for all admin operations';
COMMENT ON TABLE bookings_sync IS 'Mirror of D1 bookings for admin panel display';

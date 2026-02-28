-- ============================================================
-- Bio-Clinic Admin Panel — Database Migration
-- Run in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. SPECIALTIES
CREATE TABLE IF NOT EXISTS specialties (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_extended TEXT,
  slug TEXT UNIQUE NOT NULL,
  parent_id TEXT REFERENCES specialties(id),
  icon TEXT DEFAULT 'stethoscope',
  color_primary TEXT DEFAULT '#0d6efd',
  description_short TEXT,
  show_in_menu BOOLEAN DEFAULT true,
  show_in_homepage BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  menu_order INTEGER DEFAULT 99,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','hidden')),
  updated_by UUID,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PHYSICIANS
CREATE TABLE IF NOT EXISTS physicians (
  id TEXT PRIMARY KEY,
  title TEXT CHECK (title IN ('Prof.','Dott.','Dott.ssa')),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  display_name TEXT GENERATED ALWAYS AS (COALESCE(title,'') || ' ' || first_name || ' ' || last_name) STORED,
  specialty_id TEXT REFERENCES specialties(id),
  specialties_secondary TEXT[],
  job_title TEXT,
  role_badges TEXT[],
  is_director BOOLEAN DEFAULT false,
  bio_short TEXT,
  photo_url TEXT,
  booking_enabled BOOLEAN DEFAULT true,
  miodottore_url TEXT,
  miodottore_id TEXT,
  availability JSONB DEFAULT '{}',
  show_in_equipe BOOLEAN DEFAULT true,
  show_in_specialty BOOLEAN DEFAULT true,
  featured_on_homepage BOOLEAN DEFAULT false,
  priority_order INTEGER DEFAULT 99,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','hidden')),
  updated_by UUID,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROCEDURES
CREATE TABLE IF NOT EXISTS procedures (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_extended TEXT,
  slug TEXT UNIQUE NOT NULL,
  specialty_id TEXT REFERENCES specialties(id),
  category TEXT CHECK (category IN ('visita','diagnostica','esame','trattamento','intervento','terapia')),
  page_type TEXT DEFAULT 'A' CHECK (page_type IN ('A','B','C','D')),
  description_short TEXT,
  duration_minutes INTEGER,
  preparation_required BOOLEAN DEFAULT false,
  fasting_required BOOLEAN DEFAULT false,
  show_price BOOLEAN DEFAULT false,
  price NUMERIC(10,2),
  price_note TEXT,
  booking_priority INTEGER DEFAULT 5,
  page_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','hidden')),
  updated_by UUID,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. LAB TESTS
CREATE TABLE IF NOT EXISTS lab_tests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_extended TEXT,
  code TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  sample_type TEXT,
  fasting_required BOOLEAN DEFAULT false,
  turnaround_time TEXT,
  description_short TEXT,
  price NUMERIC(10,2),
  price_urgent NUMERIC(10,2),
  symptoms TEXT[],
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','hidden')),
  updated_by UUID,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PACKS / CHECK-UP
CREATE TABLE IF NOT EXISTS packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_extended TEXT,
  slug TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('checkup','screening','pack_lab','pack_specialist')),
  category TEXT,
  description_short TEXT,
  tagline TEXT,
  target_audience TEXT,
  exams_included JSONB DEFAULT '[]',
  exams_count INTEGER DEFAULT 0,
  price_total NUMERIC(10,2),
  savings_pct NUMERIC(5,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','hidden')),
  updated_by UUID,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PATHWAYS (Percorsi Clinici)
CREATE TABLE IF NOT EXISTS pathways (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_extended TEXT,
  name_short TEXT,
  slug TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('clinical_pathway','program','checkup_pathway')),
  description_short TEXT,
  clinical_benefit TEXT,
  target_audience TEXT,
  duration TEXT,
  expected_outcome TEXT,
  is_flagship BOOLEAN DEFAULT false,
  priority_score INTEGER DEFAULT 0,
  price_total NUMERIC(10,2),
  page_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','hidden')),
  updated_by UUID,
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CONTACTS / LEADS
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id TEXT UNIQUE,
  name TEXT,
  phone TEXT,
  email TEXT,
  service TEXT,
  message TEXT,
  source_page TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new','contacted','scheduled','completed','lost','spam')),
  assigned_to UUID,
  notes TEXT,
  follow_up_date DATE,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BOOKINGS SYNC (for dashboard upcoming bookings)
CREATE TABLE IF NOT EXISTS bookings_sync (
  id TEXT PRIMARY KEY,
  patient_name TEXT,
  service_name TEXT,
  booking_date DATE,
  booking_time TIME,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_specialties_status ON specialties(status);
CREATE INDEX IF NOT EXISTS idx_specialties_menu ON specialties(menu_order) WHERE show_in_menu = true;
CREATE INDEX IF NOT EXISTS idx_physicians_status ON physicians(status);
CREATE INDEX IF NOT EXISTS idx_physicians_specialty ON physicians(specialty_id);
CREATE INDEX IF NOT EXISTS idx_procedures_status ON procedures(status);
CREATE INDEX IF NOT EXISTS idx_procedures_specialty ON procedures(specialty_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_status ON lab_tests(status);
CREATE INDEX IF NOT EXISTS idx_lab_tests_category ON lab_tests(category);
CREATE INDEX IF NOT EXISTS idx_packs_status ON packs(status);
CREATE INDEX IF NOT EXISTS idx_pathways_status ON pathways(status);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON contacts(created_at DESC);

-- UPDATED_AT TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- APPLY TRIGGERS
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['specialties','physicians','procedures','lab_tests','packs','pathways','contacts']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON %I', tbl);
    EXECUTE format('CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', tbl);
  END LOOP;
END;
$$;

-- RLS: Enable and allow service_role full access
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['specialties','physicians','procedures','lab_tests','packs','pathways','contacts','bookings_sync']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON %I', tbl);
    EXECUTE format('CREATE POLICY "Service role full access" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END;
$$;

-- Expose tables in PostgREST schema cache
NOTIFY pgrst, 'reload schema';

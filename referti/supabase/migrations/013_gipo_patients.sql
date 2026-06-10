-- ============================================================================
-- 013: Tabella gipo_patients — Anagrafica pazienti importata da GIPO
-- ============================================================================
-- Questa tabella viene popolata dall'agente Claw (Genspark) che si connette
-- a GipoNext, legge l'anagrafica pazienti e la sincronizza qui.
--
-- Il portale referti usa questa tabella come "rubrica" per pre-compilare
-- il form di creazione paziente quando il CF non è ancora in "users".
--
-- Flusso: GIPO → Claw Agent → POST /api/admin/gipo/sync → gipo_patients
--         Dashboard lookupPatient() → users (no?) → gipo_patients (sì!) → precompila form
--
-- @date 2026-05-11
-- ============================================================================

-- ── 1. Tabella gipo_patients ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gipo_patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Dati anagrafici (da GIPO)
  fiscal_code VARCHAR(16) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email CITEXT,
  phone VARCHAR(30),
  date_of_birth DATE,
  gender VARCHAR(1) CHECK (gender IS NULL OR gender IN ('M', 'F', 'X')),

  -- Indirizzo (opzionale, se disponibile in GIPO)
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(5),
  zip_code VARCHAR(10),

  -- Identificativo GIPO (per tracciabilità e de-duplicazione)
  gipo_patient_id VARCHAR(100),

  -- Metadati sync
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),     -- ultimo aggiornamento da Claw
  sync_source VARCHAR(50) DEFAULT 'claw_agent',     -- chi ha scritto il record
  is_active BOOLEAN NOT NULL DEFAULT true,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Validazione CF
  CONSTRAINT chk_gipo_fiscal_code_format CHECK (
    fiscal_code ~ '^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$'
  )
);

-- Indici per ricerca veloce
CREATE INDEX IF NOT EXISTS idx_gipo_patients_fiscal_code ON gipo_patients (fiscal_code);
CREATE INDEX IF NOT EXISTS idx_gipo_patients_last_name ON gipo_patients (last_name);
CREATE INDEX IF NOT EXISTS idx_gipo_patients_email ON gipo_patients (email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gipo_patients_gipo_id ON gipo_patients (gipo_patient_id) WHERE gipo_patient_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gipo_patients_synced_at ON gipo_patients (synced_at DESC);

-- ── 2. RLS Policies ─────────────────────────────────────────────────────────

ALTER TABLE gipo_patients ENABLE ROW LEVEL SECURITY;

-- SELECT: admin, super_admin, ostetrica, lab_technician possono leggere
CREATE POLICY gipo_patients_select ON gipo_patients FOR SELECT
  USING (
    current_user_role() IN ('admin', 'super_admin', 'ostetrica', 'lab_technician')
  );

-- INSERT: solo service_role (Claw agent usa il service key)
-- PostgREST con service_role bypassa RLS, quindi non serve una policy INSERT
-- Ma aggiungiamo per sicurezza nel caso si usi un token autenticato
CREATE POLICY gipo_patients_insert ON gipo_patients FOR INSERT
  WITH CHECK (
    current_user_role() IN ('admin', 'super_admin')
  );

-- UPDATE: solo service_role (aggiornamenti sync da Claw)
CREATE POLICY gipo_patients_update ON gipo_patients FOR UPDATE
  USING (
    current_user_role() IN ('admin', 'super_admin')
  );

-- DELETE: solo super_admin
CREATE POLICY gipo_patients_delete ON gipo_patients FOR DELETE
  USING (
    current_user_role() = 'super_admin'
  );

-- ── 3. Trigger updated_at ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_gipo_patients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_gipo_patients_updated_at ON gipo_patients;
CREATE TRIGGER trg_gipo_patients_updated_at
  BEFORE UPDATE ON gipo_patients
  FOR EACH ROW
  EXECUTE FUNCTION update_gipo_patients_updated_at();

-- ── 4. Commento ─────────────────────────────────────────────────────────────
COMMENT ON TABLE gipo_patients IS
  'Anagrafica pazienti importata da GipoNext tramite agente Claw. Usata per pre-compilare il form di creazione paziente nel portale referti.';

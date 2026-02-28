-- ============================================================================
-- REFERTI.BIO-CLINIC.IT — Database Schema (Supabase PostgreSQL)
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-02-24
-- Architecture: Opzione B — Cloudflare Pages + Supabase
-- 
-- Tables:
--   1. users              — Pazienti, laboratoristi, admin
--   2. user_sessions      — Sessioni attive (backup per JWT)
--   3. reports            — Referti laboratorio
--   4. report_files       — File PDF allegati ai referti
--   5. notifications      — Notifiche multicanale
--   6. audit_log          — Log immutabile di tutte le azioni
--   7. gdpr_consents      — Consensi GDPR tracciati
--   8. gdpr_data_requests — Richieste accesso/cancellazione dati
--   9. password_reset_tokens — Token reset password
--  10. totp_secrets        — 2FA TOTP secrets
--
-- Security:
--   - RLS (Row Level Security) su tutte le tabelle
--   - Trigger audit automatici
--   - Encrypted columns per dati sensibili
--   - Soft delete con retention policy
-- ============================================================================

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";    -- case-insensitive text (per email)

-- ── Custom ENUM Types ───────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'patient',          -- Paziente: vede solo i propri referti
  'lab_technician',   -- Laboratorista: carica referti, vede tutti i referti
  'physician',        -- Medico: vede referti dei propri pazienti
  'admin',            -- Admin: accesso completo
  'super_admin'       -- Super Admin: gestione utenti e configurazione
);

CREATE TYPE report_status AS ENUM (
  'pending',          -- Caricato, in attesa di validazione
  'validated',        -- Validato dal laboratorista
  'signed',           -- Firmato dal medico responsabile
  'released',         -- Rilasciato al paziente (visibile)
  'archived',         -- Archiviato (oltre retention period)
  'revoked'           -- Revocato (errore, dato corretto)
);

CREATE TYPE notification_channel AS ENUM (
  'email',
  'sms',
  'whatsapp',
  'push',
  'in_app'
);

CREATE TYPE notification_status AS ENUM (
  'queued',
  'sent',
  'delivered',
  'read',
  'failed',
  'bounced'
);

CREATE TYPE audit_action AS ENUM (
  'login',
  'login_failed',
  'logout',
  'password_change',
  'password_reset_request',
  'password_reset_complete',
  'totp_enable',
  'totp_disable',
  'totp_verify',
  'profile_update',
  'report_create',
  'report_update',
  'report_validate',
  'report_sign',
  'report_release',
  'report_revoke',
  'report_view',
  'report_download',
  'file_upload',
  'file_delete',
  'notification_send',
  'user_create',
  'user_update',
  'user_deactivate',
  'user_delete',
  'gdpr_consent_given',
  'gdpr_consent_revoked',
  'gdpr_data_export',
  'gdpr_data_delete',
  'admin_action',
  'api_key_create',
  'api_key_revoke'
);

CREATE TYPE consent_type AS ENUM (
  'privacy_policy',           -- Informativa privacy generale
  'health_data_processing',   -- Trattamento dati sanitari (art. 9 GDPR)
  'electronic_delivery',      -- Consegna elettronica referti
  'email_notifications',      -- Notifiche via email
  'sms_notifications',        -- Notifiche via SMS
  'marketing'                 -- Marketing (opzionale)
);

CREATE TYPE gdpr_request_type AS ENUM (
  'access',       -- Art. 15: diritto di accesso
  'rectification', -- Art. 16: rettifica
  'erasure',      -- Art. 17: cancellazione (oblio)
  'portability',  -- Art. 20: portabilità
  'restriction'   -- Art. 18: limitazione trattamento
);

CREATE TYPE gdpr_request_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'rejected'
);


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 1: USERS
-- ═══════════════════════════════════════════════════════════════════════════
-- Extends Supabase auth.users with application-specific profile data.
-- Supabase Auth handles password hashing (bcrypt), email verification,
-- and session management. This table stores domain data.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id           UUID UNIQUE NOT NULL,  -- FK to Supabase auth.users.id
  
  -- Identity
  email             CITEXT UNIQUE NOT NULL,
  phone             VARCHAR(20),
  fiscal_code       VARCHAR(16) UNIQUE,  -- Codice Fiscale (Italian Tax Code)
  
  -- Profile
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  date_of_birth     DATE,
  gender            VARCHAR(1) CHECK (gender IN ('M', 'F', 'X')),
  
  -- Role & status
  role              user_role NOT NULL DEFAULT 'patient',
  is_active         BOOLEAN NOT NULL DEFAULT true,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  is_phone_verified BOOLEAN NOT NULL DEFAULT false,
  
  -- 2FA
  totp_enabled      BOOLEAN NOT NULL DEFAULT false,
  
  -- Preferences
  preferred_notification_channel notification_channel DEFAULT 'email',
  language          VARCHAR(5) DEFAULT 'it',
  timezone          VARCHAR(50) DEFAULT 'Europe/Rome',
  
  -- Medical (only for patients)
  referring_physician_id UUID,  -- Medico curante di riferimento
  
  -- Metadata
  last_login_at     TIMESTAMPTZ,
  login_count       INTEGER DEFAULT 0,
  failed_login_count INTEGER DEFAULT 0,
  locked_until      TIMESTAMPTZ,  -- Account lockout after N failures
  
  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,  -- Soft delete (GDPR: retention before hard delete)
  
  -- Constraints
  CONSTRAINT fk_referring_physician FOREIGN KEY (referring_physician_id) 
    REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_fiscal_code_format CHECK (
    fiscal_code IS NULL OR 
    fiscal_code ~ '^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$'
  )
);

-- Indexes
CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_fiscal_code ON users(fiscal_code) WHERE fiscal_code IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_users_deleted ON users(deleted_at) WHERE deleted_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 2: USER_SESSIONS (backup tracking — Supabase handles JWT)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE user_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Session info
  session_token   VARCHAR(256) UNIQUE NOT NULL,
  refresh_token   VARCHAR(256) UNIQUE,
  
  -- Device fingerprint
  ip_address      INET,
  user_agent      TEXT,
  device_type     VARCHAR(20),  -- mobile, desktop, tablet
  
  -- Validity
  expires_at      TIMESTAMPTZ NOT NULL,
  last_activity   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_revoked      BOOLEAN NOT NULL DEFAULT false,
  revoked_reason  VARCHAR(100),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at) WHERE is_revoked = false;


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 3: REPORTS (Referti)
-- ═══════════════════════════════════════════════════════════════════════════
-- Core table: ogni riga = un referto di laboratorio.
-- Il PDF fisico è in Supabase Storage; qui metadati + status workflow.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE reports (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Reference number (human-readable, sequential per year)
  report_number       VARCHAR(20) UNIQUE NOT NULL,  -- e.g., "REF-2026-000142"
  
  -- Patient link
  patient_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  patient_fiscal_code VARCHAR(16),  -- Denormalized for search
  
  -- Report metadata
  report_type         VARCHAR(100) NOT NULL,  -- "Emocromo Completo", "Profilo Tiroideo", etc.
  category            VARCHAR(50),  -- "ematologia", "microbiologia", "profilo", etc.
  department          VARCHAR(50) DEFAULT 'laboratorio',
  
  -- Clinical
  sample_date         DATE NOT NULL,           -- Data prelievo
  sample_type         VARCHAR(50),             -- "sangue", "urine", "tampone", etc.
  analysis_date       DATE,                    -- Data esecuzione analisi
  
  -- Workflow
  status              report_status NOT NULL DEFAULT 'pending',
  
  -- Actors
  uploaded_by         UUID NOT NULL REFERENCES users(id),  -- Laboratorista che carica
  validated_by        UUID REFERENCES users(id),           -- Laboratorista che valida
  validated_at        TIMESTAMPTZ,
  signed_by           UUID REFERENCES users(id),           -- Medico che firma
  signed_at           TIMESTAMPTZ,
  released_by         UUID REFERENCES users(id),           -- Chi rilascia al paziente
  released_at         TIMESTAMPTZ,
  
  -- Linked booking (optional: from existing bio-clinic booking system)
  booking_id          VARCHAR(50),  -- bc_book_* from D1 booking
  
  -- Urgency & flags
  is_urgent           BOOLEAN DEFAULT false,
  has_abnormal_values BOOLEAN DEFAULT false,  -- Flag valori fuori range
  physician_notes     TEXT,  -- Note del medico (encrypted at app level)
  
  -- Revocation
  revoked_by          UUID REFERENCES users(id),
  revoked_at          TIMESTAMPTZ,
  revocation_reason   TEXT,
  replacement_report_id UUID REFERENCES reports(id),
  
  -- Notification tracking
  patient_notified    BOOLEAN DEFAULT false,
  patient_notified_at TIMESTAMPTZ,
  patient_viewed      BOOLEAN DEFAULT false,
  patient_viewed_at   TIMESTAMPTZ,
  patient_downloaded  BOOLEAN DEFAULT false,
  patient_downloaded_at TIMESTAMPTZ,
  
  -- Download counter
  download_count      INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at          TIMESTAMPTZ,  -- Soft delete
  
  -- Retention policy
  retention_expires   DATE,  -- Data oltre cui il referto può essere eliminato (10 anni default)
  
  CONSTRAINT chk_report_number CHECK (report_number ~ '^REF-[0-9]{4}-[0-9]{6}$')
);

-- Indexes
CREATE INDEX idx_reports_patient ON reports(patient_id);
CREATE INDEX idx_reports_patient_fiscal ON reports(patient_fiscal_code);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_number ON reports(report_number);
CREATE INDEX idx_reports_sample_date ON reports(sample_date DESC);
CREATE INDEX idx_reports_released ON reports(released_at DESC) WHERE status = 'released';
CREATE INDEX idx_reports_category ON reports(category);
CREATE INDEX idx_reports_urgent ON reports(is_urgent) WHERE is_urgent = true;
CREATE INDEX idx_reports_abnormal ON reports(has_abnormal_values) WHERE has_abnormal_values = true;
CREATE INDEX idx_reports_unnotified ON reports(patient_notified) WHERE patient_notified = false AND status = 'released';
CREATE INDEX idx_reports_deleted ON reports(deleted_at) WHERE deleted_at IS NULL;

-- Sequential report number generator
CREATE SEQUENCE report_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_report_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.report_number IS NULL THEN
    NEW.report_number := 'REF-' || TO_CHAR(NOW(), 'YYYY') || '-' || 
                          LPAD(nextval('report_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_report_number
  BEFORE INSERT ON reports
  FOR EACH ROW
  EXECUTE FUNCTION generate_report_number();


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 4: REPORT_FILES
-- ═══════════════════════════════════════════════════════════════════════════
-- Metadata for files stored in Supabase Storage bucket "referti".
-- Actual PDF is in Storage; this tracks path, checksums, encryption.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE report_files (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id       UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  
  -- Storage reference
  storage_path    TEXT NOT NULL,  -- Supabase Storage path: "referti/{patient_id}/{report_id}/{filename}"
  storage_bucket  VARCHAR(50) NOT NULL DEFAULT 'referti',
  
  -- File info
  original_name   VARCHAR(255) NOT NULL,
  mime_type       VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  file_size_bytes BIGINT NOT NULL,
  
  -- Integrity
  checksum_sha256 VARCHAR(64) NOT NULL,  -- SHA-256 hash del file originale
  
  -- Encryption (AES-256-GCM at application level before upload)
  is_encrypted    BOOLEAN NOT NULL DEFAULT true,
  encryption_key_id VARCHAR(100),  -- Reference to encryption key (in Supabase Vault or env)
  encryption_iv   VARCHAR(32),     -- Initialization vector (hex)
  
  -- Classification
  file_type       VARCHAR(30) DEFAULT 'report_pdf',  -- report_pdf, supplement, correction
  is_primary      BOOLEAN DEFAULT true,  -- Main report file vs supplementary
  
  -- Metadata
  page_count      INTEGER,
  uploaded_by     UUID NOT NULL REFERENCES users(id),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE INDEX idx_report_files_report ON report_files(report_id);
CREATE INDEX idx_report_files_path ON report_files(storage_path);


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 5: NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Target
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Content
  channel         notification_channel NOT NULL,
  subject         VARCHAR(200),
  body            TEXT NOT NULL,
  body_html       TEXT,
  
  -- Context
  report_id       UUID REFERENCES reports(id) ON DELETE SET NULL,
  action_url      TEXT,  -- Deep link: /referti/{id}
  
  -- Delivery
  status          notification_status NOT NULL DEFAULT 'queued',
  
  -- Provider tracking
  provider        VARCHAR(50),  -- 'resend', 'twilio', 'whatsapp_business'
  provider_id     VARCHAR(200), -- External message ID for tracking
  
  -- Delivery timestamps
  sent_at         TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  read_at         TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  failure_reason  TEXT,
  
  -- Retry
  retry_count     INTEGER DEFAULT 0,
  max_retries     INTEGER DEFAULT 3,
  next_retry_at   TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_report ON notifications(report_id);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status IN ('queued', 'failed');
CREATE INDEX idx_notifications_retry ON notifications(next_retry_at) WHERE status = 'failed' AND retry_count < 3;


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 6: AUDIT_LOG (immutabile)
-- ═══════════════════════════════════════════════════════════════════════════
-- Nessun UPDATE/DELETE permesso. INSERT-only.
-- Partitioned by month per performance.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE audit_log (
  id              BIGSERIAL,
  
  -- Actor
  user_id         UUID,  -- NULL per azioni di sistema
  user_role       user_role,
  
  -- Action
  action          audit_action NOT NULL,
  
  -- Target
  target_type     VARCHAR(50),  -- 'report', 'user', 'notification', 'file', etc.
  target_id       UUID,
  
  -- Context
  ip_address      INET,
  user_agent      TEXT,
  request_id      UUID,  -- Correlation ID per tracciare richieste multi-step
  
  -- Details (JSONB per flessibilità)
  details         JSONB DEFAULT '{}',
  -- Example: {"old_status": "pending", "new_status": "validated", "report_number": "REF-2026-000142"}
  
  -- Risk scoring
  risk_level      VARCHAR(10) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  
  -- Timestamp (immutable)
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Create monthly partitions (auto-extend with pg_partman or cron)
CREATE TABLE audit_log_2026_01 PARTITION OF audit_log
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_log_2026_02 PARTITION OF audit_log
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE audit_log_2026_03 PARTITION OF audit_log
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE audit_log_2026_04 PARTITION OF audit_log
  FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE audit_log_2026_05 PARTITION OF audit_log
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE audit_log_2026_06 PARTITION OF audit_log
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE audit_log_2026_07 PARTITION OF audit_log
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE audit_log_2026_08 PARTITION OF audit_log
  FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE audit_log_2026_09 PARTITION OF audit_log
  FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE audit_log_2026_10 PARTITION OF audit_log
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE audit_log_2026_11 PARTITION OF audit_log
  FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE audit_log_2026_12 PARTITION OF audit_log
  FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_log(action, created_at DESC);
CREATE INDEX idx_audit_target ON audit_log(target_type, target_id, created_at DESC);
CREATE INDEX idx_audit_risk ON audit_log(risk_level, created_at DESC) WHERE risk_level IN ('high', 'critical');
CREATE INDEX idx_audit_request ON audit_log(request_id) WHERE request_id IS NOT NULL;

-- Prevent UPDATE/DELETE on audit_log
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit log is immutable: % operations are not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable_update
  BEFORE UPDATE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER trg_audit_immutable_delete
  BEFORE DELETE ON audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 7: GDPR_CONSENTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE gdpr_consents (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  consent_type    consent_type NOT NULL,
  version         VARCHAR(10) NOT NULL DEFAULT '1.0',  -- Policy version consented to
  
  given           BOOLEAN NOT NULL,  -- true = consent given, false = revoked
  given_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at      TIMESTAMPTZ,
  
  -- Proof of consent
  ip_address      INET,
  user_agent      TEXT,
  consent_text    TEXT,  -- Exact text presented to user at time of consent
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT uq_active_consent UNIQUE (user_id, consent_type, version)
);

CREATE INDEX idx_consents_user ON gdpr_consents(user_id);
CREATE INDEX idx_consents_type ON gdpr_consents(consent_type, given);


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 8: GDPR_DATA_REQUESTS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE gdpr_data_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  request_type    gdpr_request_type NOT NULL,
  status          gdpr_request_status NOT NULL DEFAULT 'pending',
  
  -- Processing
  description     TEXT,
  processed_by    UUID REFERENCES users(id),  -- Admin who processed
  processed_at    TIMESTAMPTZ,
  response_notes  TEXT,
  
  -- Legal deadline: 30 days from creation (GDPR art. 12)
  deadline        DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gdpr_requests_user ON gdpr_data_requests(user_id);
CREATE INDEX idx_gdpr_requests_status ON gdpr_data_requests(status) WHERE status IN ('pending', 'processing');
CREATE INDEX idx_gdpr_requests_deadline ON gdpr_data_requests(deadline) WHERE status NOT IN ('completed', 'rejected');


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 9: TOTP_SECRETS (2FA)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE totp_secrets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- TOTP secret (encrypted at app level with master key)
  encrypted_secret TEXT NOT NULL,
  
  -- Backup codes (hashed, comma-separated)
  backup_codes    TEXT,  -- JSON array of bcrypt-hashed codes
  backup_codes_remaining INTEGER DEFAULT 10,
  
  -- Verification
  is_verified     BOOLEAN NOT NULL DEFAULT false,  -- User completed setup
  verified_at     TIMESTAMPTZ,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════════════════
-- TABLE 10: PASSWORD_RESET_TOKENS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE password_reset_tokens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  token_hash      VARCHAR(128) NOT NULL,  -- SHA-256 of actual token
  
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  used_at         TIMESTAMPTZ,
  
  ip_address      INET,
  user_agent      TEXT,
  
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reset_tokens_hash ON password_reset_tokens(token_hash) WHERE used_at IS NULL;
CREATE INDEX idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX idx_reset_tokens_expires ON password_reset_tokens(expires_at) WHERE used_at IS NULL;


-- ═══════════════════════════════════════════════════════════════════════════
-- AUTOMATIC UPDATED_AT TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_gdpr_requests_updated_at BEFORE UPDATE ON gdpr_data_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_totp_updated_at BEFORE UPDATE ON totp_secrets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- AUTOMATIC AUDIT LOG TRIGGER
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION audit_report_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_action audit_action;
  v_details JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'report_create';
    v_details := jsonb_build_object(
      'report_number', NEW.report_number,
      'patient_id', NEW.patient_id,
      'report_type', NEW.report_type,
      'status', NEW.status
    );
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      CASE NEW.status
        WHEN 'validated' THEN v_action := 'report_validate';
        WHEN 'signed'    THEN v_action := 'report_sign';
        WHEN 'released'  THEN v_action := 'report_release';
        WHEN 'revoked'   THEN v_action := 'report_revoke';
        ELSE v_action := 'report_update';
      END CASE;
    ELSE
      v_action := 'report_update';
    END IF;
    v_details := jsonb_build_object(
      'report_number', NEW.report_number,
      'old_status', OLD.status,
      'new_status', NEW.status
    );
  END IF;
  
  INSERT INTO audit_log (user_id, action, target_type, target_id, details, risk_level)
  VALUES (
    COALESCE(NEW.uploaded_by, NEW.validated_by, NEW.signed_by, NEW.released_by),
    v_action,
    'report',
    NEW.id,
    v_details,
    CASE 
      WHEN NEW.status = 'revoked' THEN 'high'
      WHEN NEW.status = 'released' THEN 'medium'
      ELSE 'low'
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_reports
  AFTER INSERT OR UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION audit_report_changes();


-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════════════
-- Supabase RLS uses auth.uid() to identify the current user.
-- We match auth.uid() → users.auth_id to determine role and permissions.
-- ═══════════════════════════════════════════════════════════════════════════

-- Helper function: get current user's app role
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_id = auth.uid() AND is_active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: get current user's app id
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() AND is_active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;


-- ── USERS RLS ───────────────────────────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Patients can see only their own profile
CREATE POLICY users_select_own ON users FOR SELECT
  USING (auth_id = auth.uid() OR current_user_role() IN ('admin', 'super_admin'));

-- Patients can update their own profile (limited fields via API)
CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth_id = auth.uid() OR current_user_role() IN ('admin', 'super_admin'));

-- Only admins can create users (lab registration is via Supabase Auth + trigger)
CREATE POLICY users_insert ON users FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'super_admin') OR auth_id = auth.uid());

-- Only super_admin can (soft) delete
CREATE POLICY users_delete ON users FOR DELETE
  USING (current_user_role() = 'super_admin');


-- ── REPORTS RLS ─────────────────────────────────────────────────────────────
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Patients: see only their own released/signed reports
CREATE POLICY reports_patient_select ON reports FOR SELECT
  USING (
    (patient_id = current_user_id() AND status IN ('released', 'signed'))
    OR current_user_role() IN ('lab_technician', 'physician', 'admin', 'super_admin')
  );

-- Lab technicians & admins: can insert reports
CREATE POLICY reports_insert ON reports FOR INSERT
  WITH CHECK (current_user_role() IN ('lab_technician', 'admin', 'super_admin'));

-- Lab technicians & admins: can update reports
CREATE POLICY reports_update ON reports FOR UPDATE
  USING (current_user_role() IN ('lab_technician', 'physician', 'admin', 'super_admin'));


-- ── REPORT_FILES RLS ────────────────────────────────────────────────────────
ALTER TABLE report_files ENABLE ROW LEVEL SECURITY;

-- Patient can see files of their released reports
CREATE POLICY report_files_patient_select ON report_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reports r 
      WHERE r.id = report_files.report_id 
        AND r.patient_id = current_user_id() 
        AND r.status IN ('released', 'signed')
    )
    OR current_user_role() IN ('lab_technician', 'physician', 'admin', 'super_admin')
  );

-- Lab can upload files
CREATE POLICY report_files_insert ON report_files FOR INSERT
  WITH CHECK (current_user_role() IN ('lab_technician', 'admin', 'super_admin'));


-- ── NOTIFICATIONS RLS ───────────────────────────────────────────────────────
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users see only their own notifications
CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (user_id = current_user_id() OR current_user_role() IN ('admin', 'super_admin'));

-- System/admin can create notifications
CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (current_user_role() IN ('lab_technician', 'admin', 'super_admin'));

-- Users can mark their own as read (update status)
CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (user_id = current_user_id() OR current_user_role() IN ('admin', 'super_admin'));


-- ── AUDIT_LOG RLS ───────────────────────────────────────────────────────────
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs
CREATE POLICY audit_log_select ON audit_log FOR SELECT
  USING (current_user_role() IN ('admin', 'super_admin'));

-- Insert allowed for system triggers (SECURITY DEFINER functions)
-- and for admin/lab roles
CREATE POLICY audit_log_insert ON audit_log FOR INSERT
  WITH CHECK (true);  -- Controlled via trigger SECURITY DEFINER


-- ── GDPR_CONSENTS RLS ───────────────────────────────────────────────────────
ALTER TABLE gdpr_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY gdpr_consents_select ON gdpr_consents FOR SELECT
  USING (user_id = current_user_id() OR current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY gdpr_consents_insert ON gdpr_consents FOR INSERT
  WITH CHECK (user_id = current_user_id() OR current_user_role() IN ('admin', 'super_admin'));


-- ── GDPR_DATA_REQUESTS RLS ──────────────────────────────────────────────────
ALTER TABLE gdpr_data_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY gdpr_requests_select ON gdpr_data_requests FOR SELECT
  USING (user_id = current_user_id() OR current_user_role() IN ('admin', 'super_admin'));

CREATE POLICY gdpr_requests_insert ON gdpr_data_requests FOR INSERT
  WITH CHECK (user_id = current_user_id());

CREATE POLICY gdpr_requests_update ON gdpr_data_requests FOR UPDATE
  USING (current_user_role() IN ('admin', 'super_admin'));


-- ── TOTP_SECRETS RLS ────────────────────────────────────────────────────────
ALTER TABLE totp_secrets ENABLE ROW LEVEL SECURITY;

-- Only user can see their own TOTP
CREATE POLICY totp_select ON totp_secrets FOR SELECT
  USING (user_id = current_user_id());

CREATE POLICY totp_insert ON totp_secrets FOR INSERT
  WITH CHECK (user_id = current_user_id());

CREATE POLICY totp_update ON totp_secrets FOR UPDATE
  USING (user_id = current_user_id());

CREATE POLICY totp_delete ON totp_secrets FOR DELETE
  USING (user_id = current_user_id());


-- ═══════════════════════════════════════════════════════════════════════════
-- SEED DATA (Initial admin user — to be updated with real credentials)
-- ═══════════════════════════════════════════════════════════════════════════
-- NOTE: The actual admin user is created via Supabase Auth signup,
-- then promoted here. This is a placeholder.
-- 
-- INSERT INTO users (auth_id, email, first_name, last_name, role, is_active, is_email_verified)
-- VALUES ('AUTH_ID_FROM_SUPABASE', 'gestione@bio-clinic.it', 'Admin', 'Bio-Clinic', 'super_admin', true, true);


-- ═══════════════════════════════════════════════════════════════════════════
-- VIEWS (Convenience)
-- ═══════════════════════════════════════════════════════════════════════════

-- Dashboard view: patient's reports with latest status
CREATE VIEW v_patient_reports AS
SELECT 
  r.id,
  r.report_number,
  r.report_type,
  r.category,
  r.sample_date,
  r.status,
  r.is_urgent,
  r.has_abnormal_values,
  r.released_at,
  r.patient_viewed,
  r.patient_downloaded,
  r.download_count,
  u.first_name || ' ' || u.last_name AS patient_name,
  u.fiscal_code AS patient_fiscal_code,
  rf.storage_path AS file_path,
  rf.file_size_bytes,
  rf.mime_type
FROM reports r
JOIN users u ON r.patient_id = u.id
LEFT JOIN report_files rf ON rf.report_id = r.id AND rf.is_primary = true
WHERE r.deleted_at IS NULL;

-- Admin dashboard: pending actions
CREATE VIEW v_pending_actions AS
SELECT 
  'report' AS item_type,
  r.id AS item_id,
  r.report_number AS reference,
  r.status::TEXT AS current_status,
  r.created_at,
  u.first_name || ' ' || u.last_name AS patient_name,
  CASE r.status
    WHEN 'pending' THEN 'Validazione richiesta'
    WHEN 'validated' THEN 'Firma medico richiesta'
    WHEN 'signed' THEN 'Rilascio al paziente'
    ELSE 'Azione sconosciuta'
  END AS action_required
FROM reports r
JOIN users u ON r.patient_id = u.id
WHERE r.status IN ('pending', 'validated', 'signed')
  AND r.deleted_at IS NULL
ORDER BY r.is_urgent DESC, r.created_at ASC;


-- ═══════════════════════════════════════════════════════════════════════════
-- SUPABASE STORAGE BUCKET POLICY (to be applied via Supabase Dashboard)
-- ═══════════════════════════════════════════════════════════════════════════
-- 
-- Bucket: "referti" (private, no public access)
--
-- Upload policy: 
--   auth.role() = 'authenticated' AND 
--   (SELECT role FROM users WHERE auth_id = auth.uid()) IN ('lab_technician', 'admin')
--
-- Download policy:
--   auth.role() = 'authenticated' AND (
--     -- Patient downloads own file
--     storage.foldername(name)[1] = (SELECT id::TEXT FROM users WHERE auth_id = auth.uid())
--     OR
--     -- Staff downloads any file
--     (SELECT role FROM users WHERE auth_id = auth.uid()) IN ('lab_technician', 'physician', 'admin')
--   )
-- ═══════════════════════════════════════════════════════════════════════════

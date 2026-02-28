-- ============================================================================
-- 001: Initial Schema — Types, Tables, Indexes
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ENUM Types
CREATE TYPE user_role AS ENUM ('patient', 'lab_technician', 'physician', 'admin', 'super_admin');
CREATE TYPE report_status AS ENUM ('pending', 'validated', 'signed', 'released', 'archived', 'revoked');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'whatsapp', 'push', 'in_app');
CREATE TYPE notification_status AS ENUM ('queued', 'sent', 'delivered', 'read', 'failed', 'bounced');
CREATE TYPE audit_action AS ENUM (
  'login', 'login_failed', 'logout', 'password_change', 'password_reset_request',
  'password_reset_complete', 'totp_enable', 'totp_disable', 'totp_verify', 'profile_update',
  'report_create', 'report_update', 'report_validate', 'report_sign', 'report_release',
  'report_revoke', 'report_view', 'report_download', 'file_upload', 'file_delete',
  'notification_send', 'user_create', 'user_update', 'user_deactivate', 'user_delete',
  'gdpr_consent_given', 'gdpr_consent_revoked', 'gdpr_data_export', 'gdpr_data_delete',
  'admin_action', 'api_key_create', 'api_key_revoke'
);
CREATE TYPE consent_type AS ENUM ('privacy_policy', 'health_data_processing', 'electronic_delivery', 'email_notifications', 'sms_notifications', 'marketing');
CREATE TYPE gdpr_request_type AS ENUM ('access', 'rectification', 'erasure', 'portability', 'restriction');
CREATE TYPE gdpr_request_status AS ENUM ('pending', 'processing', 'completed', 'rejected');

-- Table: users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_id UUID UNIQUE NOT NULL,
  email CITEXT UNIQUE NOT NULL,
  phone VARCHAR(20),
  fiscal_code VARCHAR(16) UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE,
  gender VARCHAR(1) CHECK (gender IN ('M', 'F', 'X')),
  role user_role NOT NULL DEFAULT 'patient',
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_email_verified BOOLEAN NOT NULL DEFAULT false,
  is_phone_verified BOOLEAN NOT NULL DEFAULT false,
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  preferred_notification_channel notification_channel DEFAULT 'email',
  language VARCHAR(5) DEFAULT 'it',
  timezone VARCHAR(50) DEFAULT 'Europe/Rome',
  referring_physician_id UUID,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  failed_login_count INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_referring_physician FOREIGN KEY (referring_physician_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT chk_fiscal_code_format CHECK (fiscal_code IS NULL OR fiscal_code ~ '^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$')
);

CREATE INDEX idx_users_auth_id ON users(auth_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_fiscal_code ON users(fiscal_code) WHERE fiscal_code IS NOT NULL;
CREATE INDEX idx_users_role ON users(role);

-- Table: user_sessions
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(256) UNIQUE NOT NULL,
  refresh_token VARCHAR(256) UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(20),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_revoked BOOLEAN NOT NULL DEFAULT false,
  revoked_reason VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_number VARCHAR(20) UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  patient_fiscal_code VARCHAR(16),
  report_type VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  department VARCHAR(50) DEFAULT 'laboratorio',
  sample_date DATE NOT NULL,
  sample_type VARCHAR(50),
  analysis_date DATE,
  status report_status NOT NULL DEFAULT 'pending',
  uploaded_by UUID NOT NULL REFERENCES users(id),
  validated_by UUID REFERENCES users(id),
  validated_at TIMESTAMPTZ,
  signed_by UUID REFERENCES users(id),
  signed_at TIMESTAMPTZ,
  released_by UUID REFERENCES users(id),
  released_at TIMESTAMPTZ,
  booking_id VARCHAR(50),
  is_urgent BOOLEAN DEFAULT false,
  has_abnormal_values BOOLEAN DEFAULT false,
  physician_notes TEXT,
  revoked_by UUID REFERENCES users(id),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  replacement_report_id UUID REFERENCES reports(id),
  patient_notified BOOLEAN DEFAULT false,
  patient_notified_at TIMESTAMPTZ,
  patient_viewed BOOLEAN DEFAULT false,
  patient_viewed_at TIMESTAMPTZ,
  patient_downloaded BOOLEAN DEFAULT false,
  patient_downloaded_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  retention_expires DATE,
  CONSTRAINT chk_report_number CHECK (report_number ~ '^REF-[0-9]{4}-[0-9]{6}$')
);

CREATE INDEX idx_reports_patient ON reports(patient_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_number ON reports(report_number);
CREATE INDEX idx_reports_sample_date ON reports(sample_date DESC);

CREATE SEQUENCE report_number_seq START 1;

-- Table: report_files
CREATE TABLE report_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  storage_bucket VARCHAR(50) NOT NULL DEFAULT 'referti',
  original_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100) NOT NULL DEFAULT 'application/pdf',
  file_size_bytes BIGINT NOT NULL,
  checksum_sha256 VARCHAR(64) NOT NULL,
  is_encrypted BOOLEAN NOT NULL DEFAULT true,
  encryption_key_id VARCHAR(100),
  encryption_iv VARCHAR(32),
  file_type VARCHAR(30) DEFAULT 'report_pdf',
  is_primary BOOLEAN DEFAULT true,
  page_count INTEGER,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Table: notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  subject VARCHAR(200),
  body TEXT NOT NULL,
  body_html TEXT,
  report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
  action_url TEXT,
  status notification_status NOT NULL DEFAULT 'queued',
  provider VARCHAR(50),
  provider_id VARCHAR(200),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: audit_log (partitioned)
CREATE TABLE audit_log (
  id BIGSERIAL,
  user_id UUID,
  user_role user_role,
  action audit_action NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  ip_address INET,
  user_agent TEXT,
  request_id UUID,
  details JSONB DEFAULT '{}',
  risk_level VARCHAR(10) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id, created_at)
) PARTITION BY RANGE (created_at);

-- Table: gdpr_consents
CREATE TABLE gdpr_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  consent_type consent_type NOT NULL,
  version VARCHAR(10) NOT NULL DEFAULT '1.0',
  given BOOLEAN NOT NULL,
  given_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  consent_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: gdpr_data_requests
CREATE TABLE gdpr_data_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  request_type gdpr_request_type NOT NULL,
  status gdpr_request_status NOT NULL DEFAULT 'pending',
  description TEXT,
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMPTZ,
  response_notes TEXT,
  deadline DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: totp_secrets
CREATE TABLE totp_secrets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_secret TEXT NOT NULL,
  backup_codes TEXT,
  backup_codes_remaining INTEGER DEFAULT 10,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: password_reset_tokens
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 hour'),
  used_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

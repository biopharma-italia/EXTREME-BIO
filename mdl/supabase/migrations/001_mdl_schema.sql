-- ============================================================================
-- 001: MDL Initial Schema — Medicina del Lavoro
-- Conforme a D.Lgs. 81/2008, Allegato 3A/3B
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ═══════════════════════════════════════════════════════════════════════════════
-- ENUM TYPES
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TYPE mdl_user_role AS ENUM (
  'super_admin',
  'medico_competente',
  'medico_collaboratore',
  'segreteria_mdl',
  'datore_lavoro',
  'rspp',
  'lavoratore'
);

CREATE TYPE mdl_risk_level AS ENUM ('basso', 'medio', 'alto');

CREATE TYPE mdl_worker_contract AS ENUM (
  'indeterminato', 'determinato', 'somministrato',
  'apprendista', 'collaborazione', 'tirocinio', 'altro'
);

CREATE TYPE mdl_visit_type AS ENUM (
  'preventiva',        -- preassuntiva
  'periodica',         -- secondo protocollo
  'richiesta_lavoratore',
  'cambio_mansione',
  'cessazione',        -- fine rapporto (obbligatoria per esposti)
  'pre_ripresa',       -- dopo assenza > 60gg
  'straordinaria'      -- su richiesta MC/DL
);

CREATE TYPE mdl_visit_status AS ENUM (
  'programmata', 'confermata', 'in_corso',
  'completata', 'non_presentato', 'annullata'
);

CREATE TYPE mdl_fitness_type AS ENUM (
  'idoneo',
  'idoneo_con_prescrizioni',
  'idoneo_con_limitazioni_temporanee',
  'idoneo_con_limitazioni_permanenti',
  'temporaneamente_non_idoneo',
  'non_idoneo_permanente'
);

CREATE TYPE mdl_exam_periodicity AS ENUM (
  'semestrale', 'annuale', 'biennale',
  'triennale', 'quinquennale', 'una_tantum'
);

CREATE TYPE mdl_document_type AS ENUM (
  'dvr', 'duvri', 'nomina_mc', 'nomina_rspp',
  'sopralluogo', 'relazione_annuale', 'piano_sanitario',
  'verbale_riunione', 'scheda_sicurezza', 'valutazione_rischio',
  'planimetria', 'procedura_operativa', 'altro'
);

CREATE TYPE mdl_training_type AS ENUM (
  'generale_4h', 'specifica_basso_4h', 'specifica_medio_8h', 'specifica_alto_12h',
  'aggiornamento_6h', 'preposti_8h', 'dirigenti_16h', 'rls_32h', 'rls_aggiornamento',
  'primo_soccorso_16h', 'primo_soccorso_aggiornamento',
  'antincendio_livello1', 'antincendio_livello2', 'antincendio_livello3',
  'carrellisti', 'gru', 'ple', 'dpi_terza_categoria', 'spazi_confinati',
  'lavori_quota', 'rischio_elettrico', 'altro'
);

CREATE TYPE mdl_notification_status AS ENUM (
  'queued', 'sent', 'delivered', 'read', 'failed'
);

CREATE TYPE mdl_audit_action AS ENUM (
  'login', 'login_failed', 'logout',
  'company_create', 'company_update', 'company_delete',
  'worker_create', 'worker_update', 'worker_terminate',
  'visit_schedule', 'visit_complete', 'visit_cancel',
  'fitness_issue', 'fitness_sign', 'fitness_notify',
  'document_upload', 'document_view', 'document_delete',
  'health_record_view', 'health_record_update',
  'protocol_create', 'protocol_update',
  'report_generate', 'report_export',
  'admin_action', 'gdpr_export', 'gdpr_delete'
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_users (Utenti del sistema MDL)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL,
  email CITEXT UNIQUE NOT NULL,
  phone VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  fiscal_code VARCHAR(16),
  role mdl_user_role NOT NULL DEFAULT 'lavoratore',
  is_active BOOLEAN NOT NULL DEFAULT true,
  totp_enabled BOOLEAN NOT NULL DEFAULT false,
  company_id UUID, -- for datore_lavoro/rspp: their company
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_users_auth ON mdl_users(auth_id);
CREATE INDEX idx_mdl_users_email ON mdl_users(email);
CREATE INDEX idx_mdl_users_role ON mdl_users(role);
CREATE INDEX idx_mdl_users_company ON mdl_users(company_id) WHERE company_id IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_companies (Aziende Clienti)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(255) NOT NULL,
  vat_number VARCHAR(11) UNIQUE NOT NULL,
  fiscal_code VARCHAR(16),
  ateco_code VARCHAR(10),
  sector VARCHAR(150),
  risk_level mdl_risk_level NOT NULL DEFAULT 'basso',
  -- Address
  address_street VARCHAR(200),
  address_city VARCHAR(100),
  address_province VARCHAR(2),
  address_zip VARCHAR(5),
  address_region VARCHAR(50),
  -- Contacts
  pec_email CITEXT,
  phone VARCHAR(20),
  email CITEXT,
  -- Contract
  total_employees INTEGER DEFAULT 0,
  contract_type VARCHAR(50),
  contract_start DATE,
  contract_end DATE,
  contract_notes TEXT,
  -- Meta
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_companies_vat ON mdl_companies(vat_number);
CREATE INDEX idx_mdl_companies_active ON mdl_companies(is_active) WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_company_sites (Sedi Operative)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_company_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES mdl_companies(id) ON DELETE CASCADE,
  site_name VARCHAR(255) NOT NULL,
  address_street VARCHAR(200),
  address_city VARCHAR(100),
  address_province VARCHAR(2),
  address_zip VARCHAR(5),
  is_primary BOOLEAN DEFAULT false,
  employee_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_sites_company ON mdl_company_sites(company_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_safety_contacts (Figure della Sicurezza)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_safety_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES mdl_companies(id) ON DELETE CASCADE,
  site_id UUID REFERENCES mdl_company_sites(id) ON DELETE SET NULL,
  role VARCHAR(50) NOT NULL, -- datore_lavoro, rspp, aspp, mc, rls, primo_soccorso, antincendio, preposto, dirigente
  full_name VARCHAR(200) NOT NULL,
  fiscal_code VARCHAR(16),
  email CITEXT,
  phone VARCHAR(20),
  appointment_date DATE,
  appointment_expiry DATE,
  is_external BOOLEAN DEFAULT false,
  document_path TEXT, -- nomina/incarico PDF
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_safety_company ON mdl_safety_contacts(company_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_job_roles (Mansioni)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_job_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES mdl_companies(id) ON DELETE CASCADE,
  role_name VARCHAR(200) NOT NULL,
  description TEXT,
  risk_factors TEXT[] DEFAULT '{}', -- ['rumore','vibrazioni','chimico','biologico','vdt','mmc','radiazioni','stress','microclima','polveri']
  risk_level mdl_risk_level NOT NULL DEFAULT 'basso',
  dvr_reference VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, role_name)
);

CREATE INDEX idx_mdl_jobroles_company ON mdl_job_roles(company_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_workers (Lavoratori)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES mdl_users(id) ON DELETE SET NULL, -- per accesso portale
  company_id UUID NOT NULL REFERENCES mdl_companies(id),
  site_id UUID REFERENCES mdl_company_sites(id) ON DELETE SET NULL,
  -- Anagrafica
  fiscal_code VARCHAR(16) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  place_of_birth VARCHAR(100),
  gender VARCHAR(1) NOT NULL CHECK (gender IN ('M', 'F')),
  address_street VARCHAR(200),
  address_city VARCHAR(100),
  address_province VARCHAR(2),
  address_zip VARCHAR(5),
  phone VARCHAR(20),
  email CITEXT,
  language VARCHAR(5) DEFAULT 'it',
  -- Documento identita
  id_doc_type VARCHAR(30),
  id_doc_number VARCHAR(50),
  id_doc_expiry DATE,
  -- Lavoro
  hire_date DATE,
  contract_type mdl_worker_contract DEFAULT 'indeterminato',
  qualification VARCHAR(50), -- operaio, impiegato, quadro, dirigente
  department VARCHAR(100),
  work_schedule VARCHAR(50), -- giornaliero, turni, notturno
  -- Categorie particolari
  is_pregnant BOOLEAN DEFAULT false,
  is_minor BOOLEAN DEFAULT false,
  is_disabled BOOLEAN DEFAULT false,
  is_night_worker BOOLEAN DEFAULT false,
  disability_percentage INTEGER,
  -- Stato
  is_active BOOLEAN DEFAULT true,
  termination_date DATE,
  termination_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, fiscal_code)
);

CREATE INDEX idx_mdl_workers_company ON mdl_workers(company_id);
CREATE INDEX idx_mdl_workers_cf ON mdl_workers(fiscal_code);
CREATE INDEX idx_mdl_workers_active ON mdl_workers(is_active, company_id) WHERE is_active = true;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_worker_jobs (Storico Mansioni Lavoratore)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_worker_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES mdl_workers(id) ON DELETE CASCADE,
  job_role_id UUID NOT NULL REFERENCES mdl_job_roles(id),
  site_id UUID REFERENCES mdl_company_sites(id),
  department VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT true,
  change_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_workerjobs_worker ON mdl_worker_jobs(worker_id);
CREATE INDEX idx_mdl_workerjobs_current ON mdl_worker_jobs(worker_id, is_current) WHERE is_current = true;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_protocols (Protocolli Sanitari)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES mdl_companies(id) ON DELETE CASCADE,
  job_role_id UUID NOT NULL REFERENCES mdl_job_roles(id),
  protocol_name VARCHAR(200) NOT NULL,
  version VARCHAR(10) DEFAULT '1.0',
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE,
  visit_periodicity mdl_exam_periodicity NOT NULL DEFAULT 'annuale',
  notes TEXT,
  created_by UUID NOT NULL REFERENCES mdl_users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, job_role_id, version)
);

CREATE INDEX idx_mdl_protocols_company ON mdl_protocols(company_id);
CREATE INDEX idx_mdl_protocols_jobrole ON mdl_protocols(job_role_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_protocol_exams (Accertamenti Previsti nel Protocollo)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_protocol_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES mdl_protocols(id) ON DELETE CASCADE,
  exam_code VARCHAR(50) NOT NULL, -- codice identificativo esame
  exam_name VARCHAR(200) NOT NULL,
  exam_category VARCHAR(50), -- ematochimico, strumentale, specialistico, tossicologico
  periodicity mdl_exam_periodicity NOT NULL DEFAULT 'annuale',
  is_mandatory BOOLEAN DEFAULT true,
  applicable_visit_types mdl_visit_type[] DEFAULT '{preventiva,periodica}',
  reference_values TEXT,
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_protexams_protocol ON mdl_protocol_exams(protocol_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_visits (Visite Mediche)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES mdl_workers(id),
  company_id UUID NOT NULL REFERENCES mdl_companies(id),
  visit_type mdl_visit_type NOT NULL,
  protocol_id UUID REFERENCES mdl_protocols(id),
  -- Scheduling
  scheduled_date DATE,
  scheduled_time TIME,
  actual_date DATE,
  status mdl_visit_status NOT NULL DEFAULT 'programmata',
  -- Cartella Sanitaria (Allegato 3A)
  anamnesis_family TEXT,
  anamnesis_physiological TEXT,
  anamnesis_pathological_remote TEXT,
  anamnesis_pathological_recent TEXT,
  anamnesis_occupational TEXT,
  physical_examination TEXT,
  height_cm DECIMAL(5,1),
  weight_kg DECIMAL(5,1),
  bmi DECIMAL(4,1),
  blood_pressure_systolic INTEGER,
  blood_pressure_diastolic INTEGER,
  heart_rate INTEGER,
  visual_acuity_right VARCHAR(20),
  visual_acuity_left VARCHAR(20),
  conclusions TEXT,
  -- Meta
  physician_id UUID NOT NULL REFERENCES mdl_users(id),
  location VARCHAR(200), -- sede della visita
  duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_visits_worker ON mdl_visits(worker_id);
CREATE INDEX idx_mdl_visits_company ON mdl_visits(company_id);
CREATE INDEX idx_mdl_visits_date ON mdl_visits(scheduled_date);
CREATE INDEX idx_mdl_visits_status ON mdl_visits(status) WHERE status IN ('programmata', 'confermata');

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_visit_exams (Accertamenti Effettuati)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_visit_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES mdl_visits(id) ON DELETE CASCADE,
  protocol_exam_id UUID REFERENCES mdl_protocol_exams(id),
  exam_code VARCHAR(50) NOT NULL,
  exam_name VARCHAR(200) NOT NULL,
  exam_date DATE,
  -- Results
  result_text TEXT,
  result_value DECIMAL,
  result_unit VARCHAR(30),
  is_normal BOOLEAN,
  is_abnormal BOOLEAN DEFAULT false,
  reference_range VARCHAR(100),
  -- File
  attachment_path TEXT,
  attachment_encrypted BOOLEAN DEFAULT true,
  -- Meta
  lab_name VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_visitexams_visit ON mdl_visit_exams(visit_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_fitness_judgments (Giudizi di Idoneita)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_fitness_judgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES mdl_visits(id),
  worker_id UUID NOT NULL REFERENCES mdl_workers(id),
  company_id UUID NOT NULL REFERENCES mdl_companies(id),
  job_role_id UUID REFERENCES mdl_job_roles(id),
  -- Giudizio
  judgment_type mdl_fitness_type NOT NULL,
  prescriptions TEXT,
  limitations TEXT,
  limitations_start DATE,
  limitations_expiry DATE, -- per temporanee
  reevaluation_date DATE, -- per non idoneo temp
  clinical_motivation TEXT, -- visibile SOLO al MC, NON al DL
  -- Prossima visita
  next_visit_date DATE,
  next_visit_type mdl_visit_type DEFAULT 'periodica',
  -- Firma
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  signed_at TIMESTAMPTZ,
  signature_method VARCHAR(30), -- 'manual', 'digital', 'remote'
  -- Notifiche
  notified_worker BOOLEAN DEFAULT false,
  notified_worker_at TIMESTAMPTZ,
  notified_worker_method VARCHAR(20), -- email, consegna_diretta, raccomandata
  notified_employer BOOLEAN DEFAULT false,
  notified_employer_at TIMESTAMPTZ,
  -- Ricorso (art. 41 c.9)
  appeal_deadline DATE, -- issued_date + 30gg
  appeal_filed BOOLEAN DEFAULT false,
  appeal_date DATE,
  appeal_authority VARCHAR(200), -- ASL/SPSAL competente
  appeal_outcome TEXT,
  appeal_new_judgment mdl_fitness_type,
  -- PDF
  pdf_path TEXT,
  pdf_encrypted BOOLEAN DEFAULT true,
  -- Meta
  physician_id UUID NOT NULL REFERENCES mdl_users(id),
  supersedes_id UUID REFERENCES mdl_fitness_judgments(id), -- giudizio precedente
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_fitness_worker ON mdl_fitness_judgments(worker_id);
CREATE INDEX idx_mdl_fitness_company ON mdl_fitness_judgments(company_id);
CREATE INDEX idx_mdl_fitness_current ON mdl_fitness_judgments(worker_id, is_current) WHERE is_current = true;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_documents (Repository Documentale Aziendale)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES mdl_companies(id) ON DELETE CASCADE,
  document_type mdl_document_type NOT NULL,
  title VARCHAR(300) NOT NULL,
  description TEXT,
  version VARCHAR(20) DEFAULT '1.0',
  effective_date DATE,
  expiry_date DATE,
  storage_path TEXT NOT NULL,
  original_name VARCHAR(255),
  mime_type VARCHAR(100) DEFAULT 'application/pdf',
  file_size_bytes BIGINT,
  is_encrypted BOOLEAN DEFAULT true,
  uploaded_by UUID NOT NULL REFERENCES mdl_users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_docs_company ON mdl_documents(company_id);
CREATE INDEX idx_mdl_docs_type ON mdl_documents(company_id, document_type);
CREATE INDEX idx_mdl_docs_expiry ON mdl_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_training_records (Formazione Lavoratori)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_training_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES mdl_workers(id) ON DELETE CASCADE,
  training_type mdl_training_type NOT NULL,
  course_name VARCHAR(300) NOT NULL,
  provider VARCHAR(200),
  duration_hours DECIMAL(5,1),
  completion_date DATE NOT NULL,
  expiry_date DATE,
  certificate_number VARCHAR(100),
  certificate_path TEXT,
  certificate_encrypted BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_training_worker ON mdl_training_records(worker_id);
CREATE INDEX idx_mdl_training_expiry ON mdl_training_records(expiry_date) WHERE expiry_date IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_notifications (Scadenzario e Notifiche)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES mdl_users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES mdl_companies(id),
  worker_id UUID REFERENCES mdl_workers(id),
  channel VARCHAR(20) NOT NULL DEFAULT 'in_app', -- in_app, email, sms, pec
  subject VARCHAR(200),
  body TEXT NOT NULL,
  body_html TEXT,
  category VARCHAR(50), -- scadenza_visita, scadenza_formazione, scadenza_documento, giudizio, promemoria
  reference_type VARCHAR(50), -- visit, fitness_judgment, document, training
  reference_id UUID,
  status mdl_notification_status NOT NULL DEFAULT 'queued',
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ, -- per invii programmati
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_notif_user ON mdl_notifications(user_id, status);
CREATE INDEX idx_mdl_notif_scheduled ON mdl_notifications(scheduled_for) WHERE status = 'queued';

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_audit_log (Tracciamento Accessi — Art. 9 GDPR)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_audit_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  user_role mdl_user_role,
  action mdl_audit_action NOT NULL,
  target_type VARCHAR(50), -- company, worker, visit, fitness_judgment, document
  target_id UUID,
  company_id UUID, -- context: which company's data
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  risk_level VARCHAR(10) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mdl_audit_user ON mdl_audit_log(user_id, created_at DESC);
CREATE INDEX idx_mdl_audit_action ON mdl_audit_log(action, created_at DESC);
CREATE INDEX idx_mdl_audit_target ON mdl_audit_log(target_type, target_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLE: mdl_gdpr_consents
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE mdl_gdpr_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES mdl_users(id),
  worker_id UUID REFERENCES mdl_workers(id),
  consent_type VARCHAR(50) NOT NULL, -- 'health_data_processing', 'surveillance_data', 'electronic_delivery'
  version VARCHAR(10) DEFAULT '1.0',
  given BOOLEAN NOT NULL,
  given_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- FOREIGN KEY: mdl_users.company_id
-- ═══════════════════════════════════════════════════════════════════════════════

ALTER TABLE mdl_users ADD CONSTRAINT fk_mdl_users_company
  FOREIGN KEY (company_id) REFERENCES mdl_companies(id) ON DELETE SET NULL;

-- ═══════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION mdl_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mdl_companies_updated BEFORE UPDATE ON mdl_companies
  FOR EACH ROW EXECUTE FUNCTION mdl_update_timestamp();
CREATE TRIGGER trg_mdl_workers_updated BEFORE UPDATE ON mdl_workers
  FOR EACH ROW EXECUTE FUNCTION mdl_update_timestamp();
CREATE TRIGGER trg_mdl_visits_updated BEFORE UPDATE ON mdl_visits
  FOR EACH ROW EXECUTE FUNCTION mdl_update_timestamp();
CREATE TRIGGER trg_mdl_protocols_updated BEFORE UPDATE ON mdl_protocols
  FOR EACH ROW EXECUTE FUNCTION mdl_update_timestamp();
CREATE TRIGGER trg_mdl_documents_updated BEFORE UPDATE ON mdl_documents
  FOR EACH ROW EXECUTE FUNCTION mdl_update_timestamp();
CREATE TRIGGER trg_mdl_users_updated BEFORE UPDATE ON mdl_users
  FOR EACH ROW EXECUTE FUNCTION mdl_update_timestamp();

-- Calculate BMI on visit update
CREATE OR REPLACE FUNCTION mdl_calc_bmi()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.height_cm IS NOT NULL AND NEW.weight_kg IS NOT NULL AND NEW.height_cm > 0 THEN
    NEW.bmi = ROUND((NEW.weight_kg / ((NEW.height_cm / 100.0) * (NEW.height_cm / 100.0)))::NUMERIC, 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mdl_visits_bmi BEFORE INSERT OR UPDATE ON mdl_visits
  FOR EACH ROW EXECUTE FUNCTION mdl_calc_bmi();

-- Auto-set appeal_deadline = issued_date + 30 days
CREATE OR REPLACE FUNCTION mdl_set_appeal_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.appeal_deadline IS NULL THEN
    NEW.appeal_deadline = NEW.issued_date + INTERVAL '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mdl_fitness_appeal BEFORE INSERT ON mdl_fitness_judgments
  FOR EACH ROW EXECUTE FUNCTION mdl_set_appeal_deadline();

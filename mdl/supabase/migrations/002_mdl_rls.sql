-- ============================================================================
-- 002: MDL Row Level Security Policies
-- Conforme GDPR Art. 9 — Separazione dati sanitari per ruolo
-- ============================================================================

ALTER TABLE mdl_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_company_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_safety_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_worker_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_protocol_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_visit_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_fitness_judgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_training_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdl_gdpr_consents ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════════════════
-- HELPER: Get current user role
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION mdl_current_user_role()
RETURNS mdl_user_role AS $$
  SELECT role FROM mdl_users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION mdl_current_user_id()
RETURNS UUID AS $$
  SELECT id FROM mdl_users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION mdl_current_user_company()
RETURNS UUID AS $$
  SELECT company_id FROM mdl_users WHERE auth_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════════════════════════════════════════
-- mdl_users: Users can see themselves, admins/MC see all
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY mdl_users_select ON mdl_users FOR SELECT USING (
  auth_id = auth.uid()
  OR mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl')
);

CREATE POLICY mdl_users_update ON mdl_users FOR UPDATE USING (
  auth_id = auth.uid()
  OR mdl_current_user_role() IN ('super_admin')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- mdl_companies: MC/segreteria/admin see all; DL/RSPP see own
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY mdl_companies_select ON mdl_companies FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl')
  OR id = mdl_current_user_company()
);

CREATE POLICY mdl_companies_insert ON mdl_companies FOR INSERT WITH CHECK (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'segreteria_mdl')
);

CREATE POLICY mdl_companies_update ON mdl_companies FOR UPDATE USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'segreteria_mdl')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- mdl_workers: MC/segreteria see all; DL sees own company; worker sees self
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY mdl_workers_select ON mdl_workers FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl')
  OR (mdl_current_user_role() IN ('datore_lavoro', 'rspp') AND company_id = mdl_current_user_company())
  OR user_id = mdl_current_user_id()
);

CREATE POLICY mdl_workers_insert ON mdl_workers FOR INSERT WITH CHECK (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'segreteria_mdl')
);

CREATE POLICY mdl_workers_update ON mdl_workers FOR UPDATE USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'segreteria_mdl')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- mdl_visits: SOLO MC vede dettagli clinici; DL vede solo esistenza
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY mdl_visits_select ON mdl_visits FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore')
  OR (mdl_current_user_role() = 'segreteria_mdl') -- vede scheduling, non dati clinici (filtro app-level)
  OR (mdl_current_user_role() IN ('datore_lavoro', 'rspp') AND company_id = mdl_current_user_company())
);

CREATE POLICY mdl_visits_insert ON mdl_visits FOR INSERT WITH CHECK (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl')
);

CREATE POLICY mdl_visits_update ON mdl_visits FOR UPDATE USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- mdl_visit_exams: Solo MC
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY mdl_visit_exams_select ON mdl_visit_exams FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore')
);

CREATE POLICY mdl_visit_exams_insert ON mdl_visit_exams FOR INSERT WITH CHECK (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- mdl_fitness_judgments: MC vede tutto; DL vede giudizio ma NON clinical_motivation
-- (filtro app-level: la query del DL non seleziona clinical_motivation)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY mdl_fitness_select ON mdl_fitness_judgments FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore')
  OR (mdl_current_user_role() IN ('datore_lavoro', 'rspp') AND company_id = mdl_current_user_company())
  OR (mdl_current_user_role() = 'segreteria_mdl')
  OR (mdl_current_user_role() = 'lavoratore' AND worker_id IN (
    SELECT id FROM mdl_workers WHERE user_id = mdl_current_user_id()
  ))
);

CREATE POLICY mdl_fitness_insert ON mdl_fitness_judgments FOR INSERT WITH CHECK (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore')
);

CREATE POLICY mdl_fitness_update ON mdl_fitness_judgments FOR UPDATE USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- mdl_documents: MC/segreteria/admin see all; DL/RSPP see own company
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY mdl_documents_select ON mdl_documents FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl')
  OR (mdl_current_user_role() IN ('datore_lavoro', 'rspp') AND company_id = mdl_current_user_company())
);

CREATE POLICY mdl_documents_insert ON mdl_documents FOR INSERT WITH CHECK (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'segreteria_mdl')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- mdl_training_records: MC/segreteria see all; DL sees own company workers
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY mdl_training_select ON mdl_training_records FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl')
  OR (mdl_current_user_role() IN ('datore_lavoro', 'rspp') AND worker_id IN (
    SELECT id FROM mdl_workers WHERE company_id = mdl_current_user_company()
  ))
  OR (mdl_current_user_role() = 'lavoratore' AND worker_id IN (
    SELECT id FROM mdl_workers WHERE user_id = mdl_current_user_id()
  ))
);

CREATE POLICY mdl_training_insert ON mdl_training_records FOR INSERT WITH CHECK (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'segreteria_mdl')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- mdl_notifications: Users see their own
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY mdl_notif_select ON mdl_notifications FOR SELECT USING (
  user_id = mdl_current_user_id()
  OR mdl_current_user_role() IN ('super_admin', 'medico_competente', 'segreteria_mdl')
);

-- ═══════════════════════════════════════════════════════════════════════════════
-- mdl_audit_log: Solo super_admin e MC
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY mdl_audit_select ON mdl_audit_log FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente')
);

CREATE POLICY mdl_audit_insert ON mdl_audit_log FOR INSERT WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════════════════════
-- Remaining tables: standard patterns
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE POLICY mdl_sites_select ON mdl_company_sites FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl')
  OR company_id = mdl_current_user_company()
);

CREATE POLICY mdl_safety_select ON mdl_safety_contacts FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl')
  OR company_id = mdl_current_user_company()
);

CREATE POLICY mdl_jobroles_select ON mdl_job_roles FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl')
  OR company_id = mdl_current_user_company()
);

CREATE POLICY mdl_workerjobs_select ON mdl_worker_jobs FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl')
  OR worker_id IN (SELECT id FROM mdl_workers WHERE company_id = mdl_current_user_company())
);

CREATE POLICY mdl_protocols_select ON mdl_protocols FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl')
  OR company_id = mdl_current_user_company()
);

CREATE POLICY mdl_protexams_select ON mdl_protocol_exams FOR SELECT USING (
  mdl_current_user_role() IN ('super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl')
);

CREATE POLICY mdl_consents_select ON mdl_gdpr_consents FOR SELECT USING (
  user_id = mdl_current_user_id()
  OR mdl_current_user_role() IN ('super_admin', 'medico_competente')
);

-- Service role bypasses all RLS (used by backend Workers)

-- ============================================================================
-- 002: Row Level Security Policies
-- ============================================================================

-- Helper functions
CREATE OR REPLACE FUNCTION current_user_role() RETURNS user_role AS $$
  SELECT role FROM users WHERE auth_id = auth.uid() AND is_active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION current_user_id() RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() AND is_active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Users RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_select_own ON users FOR SELECT
  USING (auth_id = auth.uid() OR current_user_role() IN ('admin', 'super_admin'));
CREATE POLICY users_update_own ON users FOR UPDATE
  USING (auth_id = auth.uid() OR current_user_role() IN ('admin', 'super_admin'));
CREATE POLICY users_insert ON users FOR INSERT
  WITH CHECK (current_user_role() IN ('admin', 'super_admin') OR auth_id = auth.uid());
CREATE POLICY users_delete ON users FOR DELETE
  USING (current_user_role() = 'super_admin');

-- Reports RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_patient_select ON reports FOR SELECT
  USING (
    (patient_id = current_user_id() AND status IN ('released', 'signed'))
    OR current_user_role() IN ('lab_technician', 'physician', 'admin', 'super_admin')
  );
CREATE POLICY reports_insert ON reports FOR INSERT
  WITH CHECK (current_user_role() IN ('lab_technician', 'admin', 'super_admin'));
CREATE POLICY reports_update ON reports FOR UPDATE
  USING (current_user_role() IN ('lab_technician', 'physician', 'admin', 'super_admin'));

-- Report Files RLS
ALTER TABLE report_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY report_files_patient_select ON report_files FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM reports r WHERE r.id = report_files.report_id AND r.patient_id = current_user_id() AND r.status IN ('released', 'signed'))
    OR current_user_role() IN ('lab_technician', 'physician', 'admin', 'super_admin')
  );
CREATE POLICY report_files_insert ON report_files FOR INSERT
  WITH CHECK (current_user_role() IN ('lab_technician', 'admin', 'super_admin'));

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select ON notifications FOR SELECT
  USING (user_id = current_user_id() OR current_user_role() IN ('admin', 'super_admin'));
CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (current_user_role() IN ('lab_technician', 'admin', 'super_admin'));
CREATE POLICY notifications_update ON notifications FOR UPDATE
  USING (user_id = current_user_id() OR current_user_role() IN ('admin', 'super_admin'));

-- Audit Log RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_log_select ON audit_log FOR SELECT
  USING (current_user_role() IN ('admin', 'super_admin'));
CREATE POLICY audit_log_insert ON audit_log FOR INSERT
  WITH CHECK (true);

-- GDPR Consents RLS
ALTER TABLE gdpr_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY gdpr_consents_select ON gdpr_consents FOR SELECT
  USING (user_id = current_user_id() OR current_user_role() IN ('admin', 'super_admin'));
CREATE POLICY gdpr_consents_insert ON gdpr_consents FOR INSERT
  WITH CHECK (user_id = current_user_id() OR current_user_role() IN ('admin', 'super_admin'));

-- GDPR Requests RLS
ALTER TABLE gdpr_data_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY gdpr_requests_select ON gdpr_data_requests FOR SELECT
  USING (user_id = current_user_id() OR current_user_role() IN ('admin', 'super_admin'));
CREATE POLICY gdpr_requests_insert ON gdpr_data_requests FOR INSERT
  WITH CHECK (user_id = current_user_id());
CREATE POLICY gdpr_requests_update ON gdpr_data_requests FOR UPDATE
  USING (current_user_role() IN ('admin', 'super_admin'));

-- TOTP Secrets RLS
ALTER TABLE totp_secrets ENABLE ROW LEVEL SECURITY;
CREATE POLICY totp_select ON totp_secrets FOR SELECT USING (user_id = current_user_id());
CREATE POLICY totp_insert ON totp_secrets FOR INSERT WITH CHECK (user_id = current_user_id());
CREATE POLICY totp_update ON totp_secrets FOR UPDATE USING (user_id = current_user_id());
CREATE POLICY totp_delete ON totp_secrets FOR DELETE USING (user_id = current_user_id());

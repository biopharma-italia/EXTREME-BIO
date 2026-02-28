-- ============================================================================
-- 003: Triggers — Auto updated_at, audit log, report number, immutability
-- ============================================================================

-- Auto updated_at
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_gdpr_requests_updated_at BEFORE UPDATE ON gdpr_data_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_totp_updated_at BEFORE UPDATE ON totp_secrets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto report number
CREATE OR REPLACE FUNCTION generate_report_number() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.report_number IS NULL THEN
    NEW.report_number := 'REF-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(nextval('report_number_seq')::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_report_number BEFORE INSERT ON reports FOR EACH ROW EXECUTE FUNCTION generate_report_number();

-- Audit log immutability
CREATE OR REPLACE FUNCTION prevent_audit_modification() RETURNS TRIGGER AS $$
BEGIN RAISE EXCEPTION 'Audit log is immutable: % operations are not allowed', TG_OP; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable_update BEFORE UPDATE ON audit_log FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();
CREATE TRIGGER trg_audit_immutable_delete BEFORE DELETE ON audit_log FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- Auto audit report changes
CREATE OR REPLACE FUNCTION audit_report_changes() RETURNS TRIGGER AS $$
DECLARE v_action audit_action; v_details JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_action := 'report_create';
    v_details := jsonb_build_object('report_number', NEW.report_number, 'patient_id', NEW.patient_id, 'report_type', NEW.report_type, 'status', NEW.status);
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != NEW.status THEN
      CASE NEW.status WHEN 'validated' THEN v_action := 'report_validate'; WHEN 'signed' THEN v_action := 'report_sign'; WHEN 'released' THEN v_action := 'report_release'; WHEN 'revoked' THEN v_action := 'report_revoke'; ELSE v_action := 'report_update'; END CASE;
    ELSE v_action := 'report_update'; END IF;
    v_details := jsonb_build_object('report_number', NEW.report_number, 'old_status', OLD.status, 'new_status', NEW.status);
  END IF;
  INSERT INTO audit_log (user_id, action, target_type, target_id, details, risk_level)
  VALUES (COALESCE(NEW.uploaded_by, NEW.validated_by, NEW.signed_by, NEW.released_by), v_action, 'report', NEW.id, v_details,
    CASE WHEN NEW.status = 'revoked' THEN 'high' WHEN NEW.status = 'released' THEN 'medium' ELSE 'low' END);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_reports AFTER INSERT OR UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION audit_report_changes();

-- Audit log partitions (2026)
CREATE TABLE audit_log_2026_01 PARTITION OF audit_log FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE audit_log_2026_02 PARTITION OF audit_log FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE audit_log_2026_03 PARTITION OF audit_log FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
CREATE TABLE audit_log_2026_04 PARTITION OF audit_log FOR VALUES FROM ('2026-04-01') TO ('2026-05-01');
CREATE TABLE audit_log_2026_05 PARTITION OF audit_log FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE TABLE audit_log_2026_06 PARTITION OF audit_log FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
CREATE TABLE audit_log_2026_07 PARTITION OF audit_log FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');
CREATE TABLE audit_log_2026_08 PARTITION OF audit_log FOR VALUES FROM ('2026-08-01') TO ('2026-09-01');
CREATE TABLE audit_log_2026_09 PARTITION OF audit_log FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE audit_log_2026_10 PARTITION OF audit_log FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE audit_log_2026_11 PARTITION OF audit_log FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
CREATE TABLE audit_log_2026_12 PARTITION OF audit_log FOR VALUES FROM ('2026-12-01') TO ('2027-01-01');

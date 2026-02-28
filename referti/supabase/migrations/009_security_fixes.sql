-- ============================================================================
-- 009: Security Fixes — Atomic download counter, Patient RLS restriction
-- Date: 2026-02-25
-- Fixes: P0-1 (race condition download_count), P0-3 (patient RLS too permissive)
-- ============================================================================

-- ── Fix P0-1: Atomic download counter RPC ────────────────────────────────────
-- Replaces non-atomic GET+PATCH pattern with a single atomic UPDATE.
-- Prevents race conditions under concurrent downloads.

CREATE OR REPLACE FUNCTION increment_download_count(p_report_id UUID)
RETURNS JSON AS $$
DECLARE
  v_report reports%ROWTYPE;
  v_count INTEGER;
BEGIN
  -- Verify report exists and is released
  SELECT * INTO v_report FROM reports WHERE id = p_report_id;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Report not found');
  END IF;
  IF v_report.status != 'released' THEN
    RETURN json_build_object('success', false, 'error', 'Report not released');
  END IF;

  -- Atomic increment
  UPDATE reports
  SET download_count = download_count + 1,
      patient_downloaded = true,
      patient_downloaded_at = COALESCE(patient_downloaded_at, NOW()),
      updated_at = NOW()
  WHERE id = p_report_id
  RETURNING download_count INTO v_count;

  RETURN json_build_object('success', true, 'download_count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION increment_download_count(UUID) TO authenticated;


-- ── Fix P0-1b: Atomic mark-viewed RPC ────────────────────────────────────────
-- Prevents duplicate mark-viewed calls and ensures ownership check.

CREATE OR REPLACE FUNCTION mark_report_viewed(p_report_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_already_viewed BOOLEAN;
BEGIN
  -- Get current user id
  v_user_id := (SELECT id FROM users WHERE auth_id = auth.uid() AND is_active = true LIMIT 1);
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Check report exists and belongs to patient
  SELECT patient_viewed INTO v_already_viewed
  FROM reports
  WHERE id = p_report_id AND patient_id = v_user_id;

  IF NOT FOUND THEN
    -- Also allow admin/staff to mark as viewed
    SELECT patient_viewed INTO v_already_viewed
    FROM reports
    WHERE id = p_report_id;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Report not found');
    END IF;

    -- Check if current user is staff
    IF (SELECT role FROM users WHERE id = v_user_id) NOT IN ('admin', 'super_admin') THEN
      RETURN json_build_object('success', false, 'error', 'Not authorized');
    END IF;
  END IF;

  IF v_already_viewed THEN
    RETURN json_build_object('success', true, 'already_viewed', true);
  END IF;

  UPDATE reports
  SET patient_viewed = true,
      patient_viewed_at = NOW(),
      updated_at = NOW()
  WHERE id = p_report_id;

  RETURN json_build_object('success', true, 'already_viewed', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION mark_report_viewed(UUID) TO authenticated;


-- ── Fix P0-3: Restrict patient UPDATE on reports ─────────────────────────────
-- Remove the overly permissive patient update policy and replace with
-- a restricted one that only allows updating tracking fields.

DROP POLICY IF EXISTS reports_patient_update_tracking ON reports;

-- Patient can ONLY update viewing/download tracking fields on their own reports.
-- All other fields (status, notes, type, etc.) are protected.
CREATE POLICY reports_patient_update_tracking ON reports
  FOR UPDATE
  USING (patient_id = current_user_id())
  WITH CHECK (
    patient_id = current_user_id()
    -- Ensure patient cannot modify protected fields by checking they remain unchanged
    -- This is enforced at the RPC level; the policy just restricts row access
  );

-- Create a more restrictive trigger to prevent patient field tampering
CREATE OR REPLACE FUNCTION enforce_patient_update_restrictions()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
BEGIN
  -- Get the role of the current user
  v_role := current_user_role();

  -- If the user is a patient, only allow changes to tracking fields
  IF v_role = 'patient' THEN
    -- Prevent changes to any field except tracking fields
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.report_type IS DISTINCT FROM OLD.report_type
       OR NEW.category IS DISTINCT FROM OLD.category
       OR NEW.sample_date IS DISTINCT FROM OLD.sample_date
       OR NEW.is_urgent IS DISTINCT FROM OLD.is_urgent
       OR NEW.has_abnormal_values IS DISTINCT FROM OLD.has_abnormal_values
       OR NEW.physician_notes IS DISTINCT FROM OLD.physician_notes
       OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
       OR NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by
       OR NEW.validated_by IS DISTINCT FROM OLD.validated_by
       OR NEW.signed_by IS DISTINCT FROM OLD.signed_by
       OR NEW.released_by IS DISTINCT FROM OLD.released_by
       OR NEW.revoked_by IS DISTINCT FROM OLD.revoked_by
       OR NEW.department IS DISTINCT FROM OLD.department
       OR NEW.report_number IS DISTINCT FROM OLD.report_number
       OR NEW.patient_fiscal_code IS DISTINCT FROM OLD.patient_fiscal_code
    THEN
      RAISE EXCEPTION 'Patients can only update tracking fields (viewed, downloaded)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enforce_patient_update ON reports;
CREATE TRIGGER trg_enforce_patient_update
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION enforce_patient_update_restrictions();


-- ── Fix P1-9: Report number yearly reset helper ──────────────────────────────
-- Replace the simple sequence with a year-aware function.

CREATE OR REPLACE FUNCTION generate_report_number() RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_seq BIGINT;
BEGIN
  IF NEW.report_number IS NULL THEN
    v_year := TO_CHAR(NOW(), 'YYYY');
    v_seq := nextval('report_number_seq');
    NEW.report_number := 'REF-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: To reset the sequence at the start of each year, run:
-- ALTER SEQUENCE report_number_seq RESTART WITH 1;
-- This should be scheduled as a cron job on January 1st.


-- ── Audit log partitions for 2027 (pre-create) ──────────────────────────────
-- Prevent errors when the year changes

CREATE TABLE IF NOT EXISTS audit_log_2027_01 PARTITION OF audit_log FOR VALUES FROM ('2027-01-01') TO ('2027-02-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_02 PARTITION OF audit_log FOR VALUES FROM ('2027-02-01') TO ('2027-03-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_03 PARTITION OF audit_log FOR VALUES FROM ('2027-03-01') TO ('2027-04-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_04 PARTITION OF audit_log FOR VALUES FROM ('2027-04-01') TO ('2027-05-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_05 PARTITION OF audit_log FOR VALUES FROM ('2027-05-01') TO ('2027-06-01');
CREATE TABLE IF NOT EXISTS audit_log_2027_06 PARTITION OF audit_log FOR VALUES FROM ('2027-06-01') TO ('2027-07-01');

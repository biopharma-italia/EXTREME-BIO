-- ============================================================================
-- 010: Nuovo ruolo OSTETRICA
-- Date: 2026-02-26
-- ============================================================================
-- Permessi ostetrica:
--   - Può caricare tutti i referti (INSERT reports, report_files)
--   - Può vedere tutti i referti (SELECT reports, report_files)
--   - NON può modificare nessun referto (trigger enforcement)
--   - Può cancellare referti caricati da lei (soft-delete via UPDATE deleted_at)
--   - Può vedere tutti i dati paziente (SELECT users)
--   - Dashboard con funzionalità limitate (no admin pages)
--   - Creata solo dal super_admin
-- ============================================================================

-- ── 1. Aggiungere 'ostetrica' all'enum user_role ─────────────────────────────
DO $$
BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ostetrica';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'user_role value ostetrica already exists, skipping';
END
$$;

-- ── 2. Aggiornare le RLS policies ────────────────────────────────────────────

-- 2a. Users: ostetrica può vedere tutti gli utenti (pazienti e staff)
DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users FOR SELECT
  USING (
    auth_id = auth.uid()
    OR current_user_role() IN ('admin', 'super_admin', 'ostetrica')
  );

-- 2b. Reports SELECT: ostetrica può vedere tutti i referti
DROP POLICY IF EXISTS reports_patient_select ON reports;
CREATE POLICY reports_patient_select ON reports FOR SELECT
  USING (
    (patient_id = current_user_id() AND status IN ('released', 'signed'))
    OR current_user_role() IN ('lab_technician', 'physician', 'admin', 'super_admin', 'ostetrica')
  );

-- 2c. Reports INSERT: ostetrica può caricare referti
DROP POLICY IF EXISTS reports_insert ON reports;
CREATE POLICY reports_insert ON reports FOR INSERT
  WITH CHECK (
    current_user_role() IN ('lab_technician', 'admin', 'super_admin', 'ostetrica')
  );

-- 2d. Reports UPDATE: ostetrica NON può modificare referti
--     La policy reports_update resta invariata: solo lab_technician, physician, admin, super_admin
-- (no changes needed — ostetrica is deliberately excluded from the main update policy)

-- 2e. Reports soft-delete: ostetrica può settare deleted_at sui referti che ha caricato
--     Nota: il soft-delete è un UPDATE (setta deleted_at), non un DELETE SQL.
--     Serve una policy FOR UPDATE dedicata per ostetrica, protetta dal trigger.
DROP POLICY IF EXISTS reports_delete_ostetrica ON reports;
CREATE POLICY reports_delete_ostetrica ON reports FOR UPDATE
  USING (
    current_user_role() = 'ostetrica'
    AND uploaded_by = current_user_id()
  )
  WITH CHECK (
    current_user_role() = 'ostetrica'
    AND uploaded_by = current_user_id()
  );

-- 2f. Report Files SELECT: ostetrica può vedere tutti i file
DROP POLICY IF EXISTS report_files_patient_select ON report_files;
CREATE POLICY report_files_patient_select ON report_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_files.report_id
      AND r.patient_id = current_user_id()
      AND r.status IN ('released', 'signed')
    )
    OR current_user_role() IN ('lab_technician', 'physician', 'admin', 'super_admin', 'ostetrica')
  );

-- 2g. Report Files INSERT: ostetrica può caricare file
DROP POLICY IF EXISTS report_files_insert ON report_files;
CREATE POLICY report_files_insert ON report_files FOR INSERT
  WITH CHECK (
    current_user_role() IN ('lab_technician', 'admin', 'super_admin', 'ostetrica')
  );

-- 2h. Notifications: ostetrica può creare notifiche
DROP POLICY IF EXISTS notifications_insert ON notifications;
CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (
    current_user_role() IN ('lab_technician', 'admin', 'super_admin', 'ostetrica')
  );

-- 2i. Notifications SELECT: nessun cambiamento necessario
-- (la policy esistente: user_id = current_user_id() OR admin/super_admin va bene)

-- 2j. Audit log: nessun cambiamento necessario
-- (audit_log_insert WITH CHECK (true) è già ok)


-- ── 3. Aggiornare enforce_patient_update_restrictions per includere ostetrica ──
-- Ostetrica può solo settare deleted_at (soft delete) sui propri upload.
-- Tutti gli altri campi sono bloccati a livello di trigger.

CREATE OR REPLACE FUNCTION enforce_patient_update_restrictions()
RETURNS TRIGGER AS $$
DECLARE
  v_role user_role;
BEGIN
  v_role := current_user_role();

  -- Patients can only update tracking fields
  IF v_role = 'patient' THEN
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

  -- Ostetrica can only set deleted_at (soft delete on own uploads)
  IF v_role = 'ostetrica' THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      -- This is a soft-delete — allowed only on own uploads
      IF OLD.uploaded_by != current_user_id() THEN
        RAISE EXCEPTION 'Ostetrica can only delete reports she uploaded';
      END IF;
      -- Ensure no other fields are changed during soft-delete
      IF NEW.status IS DISTINCT FROM OLD.status
         OR NEW.report_type IS DISTINCT FROM OLD.report_type
         OR NEW.category IS DISTINCT FROM OLD.category
         OR NEW.sample_date IS DISTINCT FROM OLD.sample_date
         OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
         OR NEW.is_urgent IS DISTINCT FROM OLD.is_urgent
         OR NEW.has_abnormal_values IS DISTINCT FROM OLD.has_abnormal_values
         OR NEW.physician_notes IS DISTINCT FROM OLD.physician_notes
         OR NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by
         OR NEW.validated_by IS DISTINCT FROM OLD.validated_by
         OR NEW.signed_by IS DISTINCT FROM OLD.signed_by
         OR NEW.released_by IS DISTINCT FROM OLD.released_by
         OR NEW.revoked_by IS DISTINCT FROM OLD.revoked_by
         OR NEW.department IS DISTINCT FROM OLD.department
         OR NEW.report_number IS DISTINCT FROM OLD.report_number
         OR NEW.patient_fiscal_code IS DISTINCT FROM OLD.patient_fiscal_code
      THEN
        RAISE EXCEPTION 'Ostetrica cannot modify report fields, only delete';
      END IF;
    ELSE
      RAISE EXCEPTION 'Ostetrica cannot modify reports';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ── 4. Aggiornare mark_report_viewed per includere ostetrica come staff ──────

CREATE OR REPLACE FUNCTION mark_report_viewed(p_report_id UUID)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID;
  v_already_viewed BOOLEAN;
BEGIN
  v_user_id := (SELECT id FROM users WHERE auth_id = auth.uid() AND is_active = true LIMIT 1);
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  SELECT patient_viewed INTO v_already_viewed
  FROM reports
  WHERE id = p_report_id AND patient_id = v_user_id;

  IF NOT FOUND THEN
    SELECT patient_viewed INTO v_already_viewed
    FROM reports
    WHERE id = p_report_id;

    IF NOT FOUND THEN
      RETURN json_build_object('success', false, 'error', 'Report not found');
    END IF;

    -- Staff (including ostetrica) can view any report
    IF (SELECT role FROM users WHERE id = v_user_id) NOT IN ('admin', 'super_admin', 'ostetrica', 'lab_technician', 'physician') THEN
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


-- ── 5. Commento finale ──────────────────────────────────────────────────────
-- Il ruolo ostetrica è ora configurato nel database.
-- L'applicazione gestisce i permessi anche a livello di API middleware e frontend.
-- super_admin può creare utenti con ruolo 'ostetrica' dalla dashboard.

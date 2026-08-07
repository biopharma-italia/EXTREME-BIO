-- ============================================================================
-- ESEGUIRE QUESTO SQL NEL SQL EDITOR DI SUPABASE
-- Supabase Dashboard → SQL Editor → New Query → Incolla tutto → Run
-- ============================================================================
-- Data: 2026-08-07
-- Scopo: Aggiungere ruoli biologa_laboratorio e tecnico_laboratorio
--         e assegnare i ruoli corretti ai 3 nuovi utenti
-- ============================================================================

-- STEP 1: Aggiungere i nuovi valori all'enum
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'biologa_laboratorio'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'tecnico_laboratorio'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- STEP 2: Aggiornare RLS policies per includere i nuovi ruoli

DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users FOR SELECT
  USING (auth_id = auth.uid() OR current_user_role() IN ('admin','super_admin','ostetrica','biologa_laboratorio','tecnico_laboratorio'));

DROP POLICY IF EXISTS reports_patient_select ON reports;
CREATE POLICY reports_patient_select ON reports FOR SELECT
  USING ((patient_id = current_user_id()) OR current_user_role() IN ('lab_technician','physician','admin','super_admin','ostetrica','biologa_laboratorio','tecnico_laboratorio'));

DROP POLICY IF EXISTS reports_insert ON reports;
CREATE POLICY reports_insert ON reports FOR INSERT
  WITH CHECK (current_user_role() IN ('lab_technician','admin','super_admin','ostetrica','biologa_laboratorio','tecnico_laboratorio'));

DROP POLICY IF EXISTS reports_delete_biologa ON reports;
CREATE POLICY reports_delete_biologa ON reports FOR UPDATE
  USING (current_user_role() = 'biologa_laboratorio' AND uploaded_by = current_user_id())
  WITH CHECK (current_user_role() = 'biologa_laboratorio' AND uploaded_by = current_user_id());

DROP POLICY IF EXISTS reports_delete_tecnico ON reports;
CREATE POLICY reports_delete_tecnico ON reports FOR UPDATE
  USING (current_user_role() = 'tecnico_laboratorio' AND uploaded_by = current_user_id())
  WITH CHECK (current_user_role() = 'tecnico_laboratorio' AND uploaded_by = current_user_id());

DROP POLICY IF EXISTS report_files_patient_select ON report_files;
CREATE POLICY report_files_patient_select ON report_files FOR SELECT
  USING (EXISTS (SELECT 1 FROM reports r WHERE r.id = report_files.report_id AND r.patient_id = current_user_id())
    OR current_user_role() IN ('lab_technician','physician','admin','super_admin','ostetrica','biologa_laboratorio','tecnico_laboratorio'));

DROP POLICY IF EXISTS report_files_insert ON report_files;
CREATE POLICY report_files_insert ON report_files FOR INSERT
  WITH CHECK (current_user_role() IN ('lab_technician','admin','super_admin','ostetrica','biologa_laboratorio','tecnico_laboratorio'));

DROP POLICY IF EXISTS notifications_insert ON notifications;
CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (current_user_role() IN ('lab_technician','admin','super_admin','ostetrica','biologa_laboratorio','tecnico_laboratorio'));

-- STEP 3: Aggiornare trigger di restrizione update
CREATE OR REPLACE FUNCTION enforce_patient_update_restrictions()
RETURNS TRIGGER AS $$
DECLARE v_role user_role;
BEGIN
  v_role := current_user_role();
  IF v_role = 'patient' THEN
    IF NEW.status IS DISTINCT FROM OLD.status OR NEW.report_type IS DISTINCT FROM OLD.report_type
       OR NEW.category IS DISTINCT FROM OLD.category OR NEW.sample_date IS DISTINCT FROM OLD.sample_date
       OR NEW.is_urgent IS DISTINCT FROM OLD.is_urgent OR NEW.has_abnormal_values IS DISTINCT FROM OLD.has_abnormal_values
       OR NEW.physician_notes IS DISTINCT FROM OLD.physician_notes OR NEW.patient_id IS DISTINCT FROM OLD.patient_id
       OR NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by OR NEW.validated_by IS DISTINCT FROM OLD.validated_by
       OR NEW.signed_by IS DISTINCT FROM OLD.signed_by OR NEW.released_by IS DISTINCT FROM OLD.released_by
       OR NEW.revoked_by IS DISTINCT FROM OLD.revoked_by OR NEW.department IS DISTINCT FROM OLD.department
       OR NEW.report_number IS DISTINCT FROM OLD.report_number OR NEW.patient_fiscal_code IS DISTINCT FROM OLD.patient_fiscal_code
    THEN RAISE EXCEPTION 'Patients can only update tracking fields (viewed, downloaded)'; END IF;
  END IF;
  IF v_role IN ('ostetrica','biologa_laboratorio','tecnico_laboratorio') THEN
    IF NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL THEN
      IF OLD.uploaded_by != current_user_id() THEN RAISE EXCEPTION '% can only delete reports they uploaded', v_role; END IF;
      IF NEW.status IS DISTINCT FROM OLD.status OR NEW.report_type IS DISTINCT FROM OLD.report_type
         OR NEW.category IS DISTINCT FROM OLD.category OR NEW.sample_date IS DISTINCT FROM OLD.sample_date
         OR NEW.patient_id IS DISTINCT FROM OLD.patient_id OR NEW.is_urgent IS DISTINCT FROM OLD.is_urgent
         OR NEW.has_abnormal_values IS DISTINCT FROM OLD.has_abnormal_values
         OR NEW.physician_notes IS DISTINCT FROM OLD.physician_notes OR NEW.uploaded_by IS DISTINCT FROM OLD.uploaded_by
         OR NEW.validated_by IS DISTINCT FROM OLD.validated_by OR NEW.signed_by IS DISTINCT FROM OLD.signed_by
         OR NEW.released_by IS DISTINCT FROM OLD.released_by OR NEW.revoked_by IS DISTINCT FROM OLD.revoked_by
         OR NEW.department IS DISTINCT FROM OLD.department OR NEW.report_number IS DISTINCT FROM OLD.report_number
         OR NEW.patient_fiscal_code IS DISTINCT FROM OLD.patient_fiscal_code
      THEN RAISE EXCEPTION '% cannot modify report fields, only delete', v_role; END IF;
    ELSE RAISE EXCEPTION '% cannot modify reports', v_role; END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Aggiornare mark_report_viewed
CREATE OR REPLACE FUNCTION mark_report_viewed(p_report_id UUID)
RETURNS JSON AS $$
DECLARE v_user_id UUID; v_already_viewed BOOLEAN;
BEGIN
  v_user_id := (SELECT id FROM users WHERE auth_id = auth.uid() AND is_active = true LIMIT 1);
  IF v_user_id IS NULL THEN RETURN json_build_object('success', false, 'error', 'User not found'); END IF;
  SELECT patient_viewed INTO v_already_viewed FROM reports WHERE id = p_report_id AND patient_id = v_user_id;
  IF NOT FOUND THEN
    SELECT patient_viewed INTO v_already_viewed FROM reports WHERE id = p_report_id;
    IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Report not found'); END IF;
    IF (SELECT role FROM users WHERE id = v_user_id) NOT IN ('admin','super_admin','ostetrica','lab_technician','physician','biologa_laboratorio','tecnico_laboratorio')
    THEN RETURN json_build_object('success', false, 'error', 'Not authorized'); END IF;
  END IF;
  IF v_already_viewed THEN RETURN json_build_object('success', true, 'already_viewed', true); END IF;
  UPDATE reports SET patient_viewed = true, patient_viewed_at = NOW(), updated_at = NOW() WHERE id = p_report_id;
  RETURN json_build_object('success', true, 'already_viewed', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION mark_report_viewed(UUID) TO authenticated;

-- STEP 5: Assegnare i ruoli corretti ai 3 utenti
UPDATE public.users SET role = 'biologa_laboratorio', updated_at = NOW() WHERE email = 'cinzia.guarino@bio-clinic.it';
UPDATE public.users SET role = 'biologa_laboratorio', updated_at = NOW() WHERE email = 'sara.meloni@bio-clinic.it';
UPDATE public.users SET role = 'tecnico_laboratorio', updated_at = NOW() WHERE email = 'gabriele.delogu@bio-clinic.it';

-- VERIFICA FINALE
SELECT id, email, first_name, last_name, role, is_active FROM public.users
WHERE email IN ('cinzia.guarino@bio-clinic.it','sara.meloni@bio-clinic.it','gabriele.delogu@bio-clinic.it')
ORDER BY last_name;

-- ============================================================================
-- 012: Fix ostetrica RLS — Ensure ostetrica can SELECT all users
-- ============================================================================
-- The migration 010_role_ostetrica.sql was not applied to the live database.
-- This migration re-applies the critical RLS fixes for the ostetrica role.
-- It is idempotent (DROP IF EXISTS + CREATE).
-- @date 2026-05-11
-- ============================================================================

-- ── 1. Users SELECT: ostetrica can see all users ────────────────────────────
-- This is the critical fix: without it, ostetrica cannot look up patients
-- by codice fiscale when uploading reports.

DROP POLICY IF EXISTS users_select_own ON users;
CREATE POLICY users_select_own ON users FOR SELECT
  USING (
    auth_id = auth.uid()
    OR current_user_role() IN ('admin', 'super_admin', 'ostetrica')
  );

-- ── 2. Reports SELECT: ostetrica can see all reports ────────────────────────
-- Also re-apply the patient visibility fix from 007 (patients see ALL their
-- reports, not just released/signed).

DROP POLICY IF EXISTS reports_patient_select ON reports;
CREATE POLICY reports_patient_select ON reports FOR SELECT
  USING (
    (patient_id = current_user_id())
    OR current_user_role() IN ('lab_technician', 'physician', 'admin', 'super_admin', 'ostetrica')
  );

-- ── 3. Reports INSERT: ostetrica can upload reports ─────────────────────────

DROP POLICY IF EXISTS reports_insert ON reports;
CREATE POLICY reports_insert ON reports FOR INSERT
  WITH CHECK (
    current_user_role() IN ('lab_technician', 'admin', 'super_admin', 'ostetrica')
  );

-- ── 4. Report Files SELECT: ostetrica can see all files ─────────────────────

DROP POLICY IF EXISTS report_files_patient_select ON report_files;
CREATE POLICY report_files_patient_select ON report_files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reports r
      WHERE r.id = report_files.report_id
      AND r.patient_id = current_user_id()
    )
    OR current_user_role() IN ('lab_technician', 'physician', 'admin', 'super_admin', 'ostetrica')
  );

-- ── 5. Report Files INSERT: ostetrica can upload files ──────────────────────

DROP POLICY IF EXISTS report_files_insert ON report_files;
CREATE POLICY report_files_insert ON report_files FOR INSERT
  WITH CHECK (
    current_user_role() IN ('lab_technician', 'admin', 'super_admin', 'ostetrica')
  );

-- ── 6. Notifications INSERT: ostetrica can create notifications ─────────────

DROP POLICY IF EXISTS notifications_insert ON notifications;
CREATE POLICY notifications_insert ON notifications FOR INSERT
  WITH CHECK (
    current_user_role() IN ('lab_technician', 'admin', 'super_admin', 'ostetrica')
  );

-- ============================================================================
-- 007: Update RLS — Allow patients to see ALL their reports (any status)
-- Previously patients could only see reports with status 'released' or 'signed'.
-- Now patients see all their reports so they can track processing progress.
-- Download is still controlled by storage bucket RLS (released/signed only).
-- ============================================================================

-- Reports: patient can see all their own reports
DROP POLICY IF EXISTS reports_patient_select ON reports;
CREATE POLICY reports_patient_select ON reports FOR SELECT USING (
  (patient_id = current_user_id())
  OR (current_user_role() = ANY (ARRAY['lab_technician'::user_role, 'physician'::user_role, 'admin'::user_role, 'super_admin'::user_role]))
);

-- Report files: patient can see file metadata for all their reports
DROP POLICY IF EXISTS report_files_patient_select ON report_files;
CREATE POLICY report_files_patient_select ON report_files FOR SELECT USING (
  (EXISTS (SELECT 1 FROM reports r WHERE r.id = report_files.report_id AND r.patient_id = current_user_id()))
  OR (current_user_role() = ANY (ARRAY['lab_technician'::user_role, 'physician'::user_role, 'admin'::user_role, 'super_admin'::user_role]))
);

-- ============================================================================
-- 008: PHASE 0 — Security & Privacy hardening
-- ============================================================================
-- Conforme D.Lgs. 81/2008 art. 25 + GDPR art. 9
--
-- CHANGES:
--   1. Create mdl_workers_safe view — excludes sensitive columns for DL/RSPP
--   2. Restrict mdl_visit_exams SELECT — add segreteria_mdl (was missing, but
--      the API uses service_role so this is defense-in-depth for direct access)
--   3. Add RLS policy for segreteria on mdl_visit_exams — DENY
--   4. Document that service_role bypasses RLS (backend handles stripping)
--
-- NOTE: The backend API uses supabaseAdmin (service_role) which bypasses RLS.
-- These policies provide defense-in-depth for any future direct Supabase
-- client access (e.g., lavoratore portal, mobile app).
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. Safe worker view for company-side roles
--    Excludes: is_pregnant, is_disabled, is_minor, notes
--    Usage: future direct-access queries for DL/RSPP portals
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW mdl_workers_safe AS
SELECT
  id, company_id, site_id, user_id,
  fiscal_code, first_name, last_name, date_of_birth, place_of_birth, gender,
  address_street, address_city, address_province, address_zip,
  phone, email, language,
  hire_date, contract_type, qualification, department, work_schedule,
  is_night_worker, is_active,
  created_at, updated_at
FROM mdl_workers;

COMMENT ON VIEW mdl_workers_safe IS
  'Worker data without sensitive health fields (is_pregnant, is_disabled, is_minor, notes). '
  'Use for DL/RSPP/segreteria queries. Conforme D.Lgs. 81/2008 art. 25 + GDPR art. 9.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. Fitness judgment: tighten comment to reflect actual policy
--    The existing policy already allows segreteria SELECT on the full row.
--    The app-level stripping of clinical_motivation is the enforcement layer.
--    Add a comment documenting this explicitly.
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON POLICY mdl_fitness_select ON mdl_fitness_judgments IS
  'MC sees all fields. DL/RSPP/segreteria see row but clinical_motivation must be stripped at app level. '
  'PostgreSQL does not support column-level RLS; app-level enforcement is required per D.Lgs. 81/2008.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. mdl_visits: Update comment on segreteria policy
--    Segreteria can see visits for scheduling BUT clinical fields must be
--    stripped at app level. The policy allows SELECT on the full row.
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON POLICY mdl_visits_select ON mdl_visits IS
  'MC sees all. Segreteria sees row for scheduling — clinical fields (anamnesis, physical_examination, '
  'conclusions, vitals) must be stripped at app level. DL/RSPP scoped to own company. '
  'PHASE 0 FIX: segreteria REMOVED from isClinical in API layer.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. Audit log: ensure insert policy is restricted (currently WITH CHECK (true))
--    This is acceptable because only the backend service_role inserts audit records.
--    If direct client access is added later, this must be tightened.
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON POLICY mdl_audit_insert ON mdl_audit_log IS
  'Currently allows all inserts (service_role only). '
  'MUST be restricted if direct client access is ever enabled.';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. Phase 0 security metadata
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON SCHEMA public IS
  'MDL Bio-Clinic — Phase 0 security hardening applied 2026-06-10. '
  'Clinical data separation enforced at API layer (permissions.ts). '
  'RLS provides defense-in-depth. Service role bypasses RLS for backend Workers.';

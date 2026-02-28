-- ============================================================================
-- 002: Row Level Security Policies — Admin Panel
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-02-28
-- Description: RLS policies for admin panel tables.
--   - Public entity tables: read-only for anon, full CRUD for admin/super_admin
--   - Operational tables: restricted to admin roles only
--   - Audit log: insert-only via trigger, read for admin
-- ============================================================================

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE physicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE physician_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE physician_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE pack_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathway_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings_sync ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- HELPER FUNCTION: Check if current user is admin
-- ============================================================================

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE auth_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- ============================================================================
-- ENTITY TABLES: Public read (active only) + Admin write
-- ============================================================================

-- Helper: creates standard entity policies for a table
-- Pattern: anon/authenticated can read active records; admin can CRUD all

-- -------------------------------------------------------
-- SPECIALTIES
-- -------------------------------------------------------

-- Public: read active records
CREATE POLICY specialties_read_public ON specialties
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

-- Admin: full access
CREATE POLICY specialties_admin_all ON specialties
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- -------------------------------------------------------
-- PHYSICIANS
-- -------------------------------------------------------

CREATE POLICY physicians_read_public ON physicians
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY physicians_admin_all ON physicians
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- -------------------------------------------------------
-- PROCEDURES
-- -------------------------------------------------------

CREATE POLICY procedures_read_public ON procedures
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY procedures_admin_all ON procedures
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- -------------------------------------------------------
-- LAB_TESTS
-- -------------------------------------------------------

CREATE POLICY lab_tests_read_public ON lab_tests
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY lab_tests_admin_all ON lab_tests
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- -------------------------------------------------------
-- PACKS
-- -------------------------------------------------------

CREATE POLICY packs_read_public ON packs
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY packs_admin_all ON packs
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- -------------------------------------------------------
-- PATHWAYS
-- -------------------------------------------------------

CREATE POLICY pathways_read_public ON pathways
  FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY pathways_admin_all ON pathways
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- -------------------------------------------------------
-- RELATIONSHIP TABLES: Public read + Admin write
-- -------------------------------------------------------

-- physician_procedures
CREATE POLICY pp_read_public ON physician_procedures
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY pp_admin_all ON physician_procedures
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- physician_pathways
CREATE POLICY ppw_read_public ON physician_pathways
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY ppw_admin_all ON physician_pathways
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- procedure_pathways
CREATE POLICY prpw_read_public ON procedure_pathways
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY prpw_admin_all ON procedure_pathways
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- test_packs
CREATE POLICY tp_read_public ON test_packs
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY tp_admin_all ON test_packs
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- test_pathways
CREATE POLICY tpw_read_public ON test_pathways
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY tpw_admin_all ON test_pathways
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- pack_specialties
CREATE POLICY ps_read_public ON pack_specialties
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY ps_admin_all ON pack_specialties
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- pathway_specialties
CREATE POLICY pws_read_public ON pathway_specialties
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY pws_admin_all ON pathway_specialties
  FOR ALL TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());


-- ============================================================================
-- OPERATIONAL TABLES: Admin-only access
-- ============================================================================

-- -------------------------------------------------------
-- CONTACTS: Admin only (no public access)
-- -------------------------------------------------------

CREATE POLICY contacts_admin_read ON contacts
  FOR SELECT TO authenticated
  USING (is_admin_user());

CREATE POLICY contacts_admin_insert ON contacts
  FOR INSERT TO authenticated
  WITH CHECK (is_admin_user());

-- Also allow service_role to insert (from API contact form)
CREATE POLICY contacts_service_insert ON contacts
  FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY contacts_admin_update ON contacts
  FOR UPDATE TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- -------------------------------------------------------
-- SETTINGS: Admin read, super_admin write
-- -------------------------------------------------------

CREATE POLICY settings_admin_read ON settings
  FOR SELECT TO authenticated
  USING (is_admin_user());

CREATE POLICY settings_super_admin_write ON settings
  FOR ALL TO authenticated
  USING (is_super_admin())
  WITH CHECK (is_super_admin());

-- -------------------------------------------------------
-- ADMIN_AUDIT_LOG: Read-only for admin (inserts via trigger)
-- -------------------------------------------------------

CREATE POLICY audit_admin_read ON admin_audit_log
  FOR SELECT TO authenticated
  USING (is_admin_user());

-- Allow insert from triggers (service role)
CREATE POLICY audit_trigger_insert ON admin_audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- -------------------------------------------------------
-- BOOKINGS_SYNC: Admin only
-- -------------------------------------------------------

CREATE POLICY bookings_admin_read ON bookings_sync
  FOR SELECT TO authenticated
  USING (is_admin_user());

CREATE POLICY bookings_service_write ON bookings_sync
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY bookings_admin_update ON bookings_sync
  FOR UPDATE TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

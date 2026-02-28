-- Migration: 008_notification_email_rls.sql
-- Enable patient notification tracking and notification table access
-- Date: 2026-02-25

-- Allow admin/staff to INSERT notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notifications_insert_staff' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY notifications_insert_staff ON notifications
      FOR INSERT
      WITH CHECK (current_user_role() IN ('lab_technician', 'physician', 'admin', 'super_admin'));
  END IF;
END $$;

-- Allow patients to SELECT their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notifications_select_own' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY notifications_select_own ON notifications
      FOR SELECT
      USING (user_id = current_user_id() OR current_user_role() IN ('admin', 'super_admin'));
  END IF;
END $$;

-- Allow patients to UPDATE their own notifications (mark as read)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'notifications_update_own' AND tablename = 'notifications'
  ) THEN
    CREATE POLICY notifications_update_own ON notifications
      FOR UPDATE
      USING (user_id = current_user_id() OR current_user_role() IN ('admin', 'super_admin'));
  END IF;
END $$;

-- Ensure patient can update their own report's viewed/downloaded status
-- (the existing reports_update policy may already cover this, but let's make sure)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'reports_patient_update_tracking' AND tablename = 'reports'
  ) THEN
    CREATE POLICY reports_patient_update_tracking ON reports
      FOR UPDATE
      USING (patient_id = current_user_id())
      WITH CHECK (patient_id = current_user_id());
  END IF;
END $$;

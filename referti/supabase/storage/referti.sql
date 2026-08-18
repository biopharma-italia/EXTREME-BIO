-- ============================================================================
-- Supabase Storage — "referti" bucket + policies
-- ============================================================================
-- Run via Supabase Dashboard → SQL Editor (Storage policies require auth context)

-- Create private bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('referti', 'referti', false)
ON CONFLICT (id) DO NOTHING;

-- Upload policy: only lab/ostetrica/admin can upload
-- 2026-08-18: aggiunto ruolo 'ostetrica' (allineamento con API / dashboard)
CREATE POLICY "Lab staff can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'referti'
    AND auth.role() = 'authenticated'
    AND (SELECT role FROM public.users WHERE auth_id = auth.uid()) IN ('lab_technician', 'ostetrica', 'admin', 'super_admin')
  );

-- Download policy: own files or staff
CREATE POLICY "Users can download own files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'referti'
    AND auth.role() = 'authenticated'
    AND (
      (storage.foldername(name))[1] = (SELECT id::TEXT FROM public.users WHERE auth_id = auth.uid())
      OR (SELECT role FROM public.users WHERE auth_id = auth.uid()) IN ('lab_technician', 'ostetrica', 'physician', 'admin', 'super_admin')
    )
  );

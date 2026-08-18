-- ============================================================================
-- 018 — Storage bucket "referti": aggiunge il ruolo 'ostetrica' alle policy
-- ============================================================================
-- ⚠️ ESEGUIRE MANUALMENTE in Supabase Dashboard → SQL Editor
-- Data: 2026-08-18
--
-- Problema: la policy di upload del bucket 'referti' non include il ruolo
-- 'ostetrica' — l'upload dalla dashboard funziona solo perché passa dalla
-- service key lato API, ma la policy in repo/prod era disallineata.
-- Questo script riallinea le policy (upload + download) con i ruoli reali.
--
-- Idempotente: DROP POLICY IF EXISTS + CREATE POLICY.
-- ============================================================================

-- Upload: lab_technician, ostetrica, admin, super_admin
DROP POLICY IF EXISTS "Lab staff can upload" ON storage.objects;
CREATE POLICY "Lab staff can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'referti'
    AND auth.role() = 'authenticated'
    AND (SELECT role FROM public.users WHERE auth_id = auth.uid()) IN ('lab_technician', 'ostetrica', 'admin', 'super_admin')
  );

-- Download: propri file (cartella = user id) oppure staff
DROP POLICY IF EXISTS "Users can download own files" ON storage.objects;
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

-- Verifica finale: elenca le policy attive sul bucket referti
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
  AND (qual LIKE '%referti%' OR with_check LIKE '%referti%');

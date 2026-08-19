-- ============================================================================
-- 018 — Storage bucket "referti": aggiunge il ruolo 'ostetrica' alle policy
-- ============================================================================
-- Data: 2026-08-18
--
-- ✅ VERIFICATO LIVE 2026-08-19: la policy in PRODUZIONE include GIÀ il ruolo
-- 'ostetrica' (test empirico: upload storage come utente ostetrica → HTTP 200;
-- come patient → 403 RLS violation). Il disallineamento era solo nel file in
-- repo (referti/supabase/storage/referti.sql), ora corretto.
-- Questo script NON è quindi urgente da eseguire: serve solo come riferimento
-- idempotente se le policy dovessero essere ricreate da zero.
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

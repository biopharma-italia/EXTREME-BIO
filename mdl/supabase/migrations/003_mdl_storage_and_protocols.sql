-- ============================================================================
-- 003: MDL Storage Bucket + Sample Protocol with Exams
-- ============================================================================

-- Create Supabase Storage bucket for MDL files (referti, idoneità PDFs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mdl-files',
  'mdl-files',
  false,
  20971520, -- 20MB max
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/dicom']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users in MDL roles can access
CREATE POLICY "mdl_files_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'mdl-files');

CREATE POLICY "mdl_files_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'mdl-files');

CREATE POLICY "mdl_files_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'mdl-files');

CREATE POLICY "mdl_files_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'mdl-files');

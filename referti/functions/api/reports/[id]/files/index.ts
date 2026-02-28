/**
 * ============================================================================
 * POST /api/reports/[id]/files — Upload report file (PDF)
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../../../_middleware';
import { validateUuid, validatePdfMagicBytes, validateFileSize } from '../../../../../src/lib/validators';
import { deriveKey, encryptData, computeChecksum } from '../../../../../src/lib/encryption';
import type { RequestContext } from '../../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  MASTER_ENCRYPTION_KEY: string;
}

export async function onRequestPost(context: {
  request: Request;
  params: { id: string };
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data, params } = context;
  const { ctx, env } = data;

  const authError = requireRole(ctx, 'lab_technician', 'admin', 'super_admin', 'ostetrica');
  if (authError) return authError;

  const reportId = params.id;
  if (!validateUuid(reportId)) {
    return jsonResponse({ success: false, error: 'ID referto non valido.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify report exists
  const { data: report } = await adminClient
    .from('reports')
    .select('id, patient_id, report_number')
    .eq('id', reportId)
    .is('deleted_at', null)
    .single();

  if (!report) {
    return jsonResponse({ success: false, error: 'Referto non trovato.' }, 404);
  }

  // Parse multipart form data
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const fileType = (formData.get('file_type') as string) || 'report_pdf';
  const isPrimary = formData.get('is_primary') !== 'false';

  if (!file) {
    return jsonResponse({ success: false, error: 'File PDF obbligatorio.' }, 400);
  }

  // Validate file size (max 10MB)
  if (!validateFileSize(file.size)) {
    return jsonResponse({ success: false, error: 'File troppo grande. Massimo 10 MB.' }, 400);
  }

  // Read file buffer
  const fileBuffer = await file.arrayBuffer();

  // Validate PDF magic bytes
  if (!validatePdfMagicBytes(fileBuffer)) {
    return jsonResponse({ success: false, error: 'Il file non è un PDF valido.' }, 400);
  }

  // Compute checksum of original file
  const checksum = await computeChecksum(fileBuffer);

  // Encrypt file
  const aad = `${reportId}:${report.patient_id}`;
  const encryptionKey = await deriveKey(env.MASTER_ENCRYPTION_KEY, reportId);
  const { ciphertext, iv } = await encryptData(fileBuffer, encryptionKey, aad);

  // Upload encrypted file to Supabase Storage
  const storagePath = `${report.patient_id}/${reportId}/${file.name}.enc`;

  const { error: uploadError } = await adminClient.storage
    .from('referti')
    .upload(storagePath, ciphertext, {
      contentType: 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    console.error('[FileUpload] Storage error:', uploadError.message);
    return jsonResponse({ success: false, error: 'Errore nel caricamento del file.' }, 500);
  }

  // Create file record
  const { data: fileRecord, error: insertError } = await adminClient
    .from('report_files')
    .insert({
      report_id: reportId,
      storage_path: storagePath,
      storage_bucket: 'referti',
      original_name: file.name,
      mime_type: 'application/pdf',
      file_size_bytes: file.size,
      checksum_sha256: checksum,
      is_encrypted: true,
      encryption_key_id: 'v1',
      encryption_iv: iv,
      file_type: fileType,
      is_primary: isPrimary,
      uploaded_by: ctx.user!.id,
    })
    .select('id, storage_path, file_size_bytes, checksum_sha256')
    .single();

  if (insertError) {
    console.error('[FileUpload] DB error:', insertError.message);
    // Cleanup: remove uploaded file
    await adminClient.storage.from('referti').remove([storagePath]);
    return jsonResponse({ success: false, error: 'Errore nel salvataggio dei metadati.' }, 500);
  }

  // Audit log
  await adminClient.from('audit_log').insert({
    user_id: ctx.user!.id,
    user_role: ctx.user!.role,
    action: 'file_upload',
    target_type: 'report',
    target_id: reportId,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: {
      report_number: report.report_number,
      file_name: file.name,
      file_size: file.size,
      checksum: checksum,
    },
    risk_level: 'low',
  });

  return jsonResponse({
    success: true,
    data: {
      file_id: fileRecord.id,
      storage_path: fileRecord.storage_path,
      file_size_bytes: fileRecord.file_size_bytes,
      checksum_sha256: fileRecord.checksum_sha256,
      is_encrypted: true,
    },
  }, 201);
}

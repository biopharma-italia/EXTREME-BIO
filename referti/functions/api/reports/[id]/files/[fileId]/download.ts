/**
 * ============================================================================
 * GET /api/reports/[id]/files/[fileId]/download
 * ============================================================================
 * Downloads and decrypts a report PDF.
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../../../_middleware';
import { validateUuid } from '../../../../../../src/lib/validators';
import { deriveKey, decryptData, computeChecksum } from '../../../../../../src/lib/encryption';
import type { RequestContext } from '../../../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  MASTER_ENCRYPTION_KEY: string;
}

export async function onRequestGet(context: {
  request: Request;
  params: { id: string; fileId: string };
  data: { ctx: RequestContext; env: Env };
}) {
  const { data, params } = context;
  const { ctx, env } = data;

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  const { id: reportId, fileId } = params;
  if (!validateUuid(reportId) || !validateUuid(fileId)) {
    return jsonResponse({ success: false, error: 'Parametri non validi.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get report and file metadata
  const { data: report } = await adminClient
    .from('reports')
    .select('id, patient_id, report_number, status, download_count')
    .eq('id', reportId)
    .is('deleted_at', null)
    .single();

  if (!report) {
    return jsonResponse({ success: false, error: 'Referto non trovato.' }, 404);
  }

  // RBAC check
  if (ctx.user.role === 'patient') {
    if (report.patient_id !== ctx.user.id) {
      return jsonResponse({ success: false, error: 'Accesso negato.' }, 403);
    }
    if (!['released', 'signed'].includes(report.status)) {
      return jsonResponse({ success: false, error: 'Referto non ancora disponibile.' }, 403);
    }
  }

  const { data: fileRecord } = await adminClient
    .from('report_files')
    .select('*')
    .eq('id', fileId)
    .eq('report_id', reportId)
    .is('deleted_at', null)
    .single();

  if (!fileRecord) {
    return jsonResponse({ success: false, error: 'File non trovato.' }, 404);
  }

  // Download encrypted file from Storage
  const { data: storageData, error: downloadError } = await adminClient.storage
    .from(fileRecord.storage_bucket)
    .download(fileRecord.storage_path);

  if (downloadError || !storageData) {
    console.error('[Download] Storage error:', downloadError?.message);
    return jsonResponse({ success: false, error: 'Errore nel download del file.' }, 500);
  }

  const encryptedBuffer = await storageData.arrayBuffer();

  // Decrypt
  let plaintext: ArrayBuffer;
  try {
    const key = await deriveKey(env.MASTER_ENCRYPTION_KEY, reportId);
    const aad = `${reportId}:${report.patient_id}`;
    plaintext = await decryptData(encryptedBuffer, key, fileRecord.encryption_iv, aad);
  } catch (err) {
    console.error('[Download] Decryption error:', err);
    return jsonResponse({ success: false, error: 'Errore nella decifratura del file.' }, 500);
  }

  // Verify checksum
  const checksum = await computeChecksum(plaintext);
  if (checksum !== fileRecord.checksum_sha256) {
    console.error('[Download] Checksum mismatch:', checksum, '!=', fileRecord.checksum_sha256);
    return jsonResponse({ success: false, error: 'Integrità del file compromessa.' }, 500);
  }

  // Update report tracking
  if (ctx.user.role === 'patient') {
    adminClient.from('reports').update({
      patient_downloaded: true,
      patient_downloaded_at: new Date().toISOString(),
      download_count: report.download_count ? report.download_count + 1 : 1,
    }).eq('id', reportId).then(() => {}).catch(() => {});
  }

  // Audit log
  adminClient.from('audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: 'report_download',
    target_type: 'report',
    target_id: reportId,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: {
      report_number: report.report_number,
      file_name: fileRecord.original_name,
      file_id: fileId,
    },
    risk_level: ctx.user.role === 'patient' ? 'low' : 'medium',
  }).then(() => {}).catch(() => {});

  // Construct filename
  const downloadName = `${report.report_number}_${fileRecord.original_name}`;

  return new Response(plaintext, {
    status: 200,
    headers: {
      'Content-Type': fileRecord.mime_type,
      'Content-Disposition': `attachment; filename="${downloadName}"`,
      'Content-Length': plaintext.byteLength.toString(),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

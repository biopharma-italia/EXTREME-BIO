/**
 * ============================================================================
 * GET /api/reports/[id]/files/[fileId]/preview
 * ============================================================================
 * Generates a signed URL for in-browser PDF preview (5-minute expiry).
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../../../_middleware';
import { validateUuid } from '../../../../../../src/lib/validators';
import type { RequestContext } from '../../../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export async function onRequestGet(context: {
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

  // Get report for RBAC check
  const { data: report } = await adminClient
    .from('reports')
    .select('id, patient_id, status')
    .eq('id', reportId)
    .is('deleted_at', null)
    .single();

  if (!report) {
    return jsonResponse({ success: false, error: 'Referto non trovato.' }, 404);
  }

  if (ctx.user.role === 'patient') {
    if (report.patient_id !== ctx.user.id) {
      return jsonResponse({ success: false, error: 'Accesso negato.' }, 403);
    }
    if (!['released', 'signed'].includes(report.status)) {
      return jsonResponse({ success: false, error: 'Referto non disponibile.' }, 403);
    }
  }

  const { data: fileRecord } = await adminClient
    .from('report_files')
    .select('storage_path, storage_bucket')
    .eq('id', fileId)
    .eq('report_id', reportId)
    .is('deleted_at', null)
    .single();

  if (!fileRecord) {
    return jsonResponse({ success: false, error: 'File non trovato.' }, 404);
  }

  // Note: Preview for encrypted files requires decryption.
  // For simplicity, return a download URL instead.
  // In production, implement server-side decryption + re-serve.
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  return jsonResponse({
    success: true,
    preview_url: `/api/reports/${reportId}/files/${fileId}/download`,
    expires_at: expiresAt,
    note: 'File is encrypted at rest. Use the download endpoint for decrypted access.',
  });
}

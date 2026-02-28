/**
 * ============================================================================
 * POST /api/reports/[id]/revoke
 * ============================================================================
 * Revokes a report (error correction). Admin only.
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../../_middleware';
import { validateUuid, sanitizeInput } from '../../../../src/lib/validators';
import type { RequestContext } from '../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export async function onRequestPost(context: {
  request: Request;
  params: { id: string };
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data, params } = context;
  const { ctx, env } = data;

  const authError = requireRole(ctx, 'admin', 'super_admin');
  if (authError) return authError;

  const reportId = params.id;
  if (!validateUuid(reportId)) {
    return jsonResponse({ success: false, error: 'ID referto non valido.' }, 400);
  }

  let body: { reason?: string; replacement_report_id?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  if (!body.reason || body.reason.trim().length < 10) {
    return jsonResponse({
      success: false,
      error: 'Motivazione obbligatoria (minimo 10 caratteri).',
    }, 400);
  }

  if (body.replacement_report_id && !validateUuid(body.replacement_report_id)) {
    return jsonResponse({ success: false, error: 'ID referto sostitutivo non valido.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: report } = await adminClient
    .from('reports')
    .select('id, status, report_number, patient_id')
    .eq('id', reportId)
    .is('deleted_at', null)
    .single();

  if (!report) {
    return jsonResponse({ success: false, error: 'Referto non trovato.' }, 404);
  }

  if (report.status === 'revoked') {
    return jsonResponse({ success: false, error: 'Referto già revocato.' }, 400);
  }

  await adminClient.from('reports').update({
    status: 'revoked',
    revoked_by: ctx.user!.id,
    revoked_at: new Date().toISOString(),
    revocation_reason: sanitizeInput(body.reason, 1000),
    replacement_report_id: body.replacement_report_id || null,
  }).eq('id', reportId);

  // Notify patient if report was already released
  if (report.status === 'released') {
    await adminClient.from('notifications').insert({
      user_id: report.patient_id,
      channel: 'email',
      subject: 'Referto revocato',
      body: `Il referto ${report.report_number} è stato revocato. Motivo: ${body.reason}`,
      report_id: reportId,
      action_url: `/dashboard/referti`,
      status: 'queued',
      provider: 'resend',
    });
  }

  // Audit log (high risk)
  await adminClient.from('audit_log').insert({
    user_id: ctx.user!.id,
    user_role: ctx.user!.role,
    action: 'report_revoke',
    target_type: 'report',
    target_id: reportId,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: {
      report_number: report.report_number,
      previous_status: report.status,
      reason: body.reason,
      replacement_report_id: body.replacement_report_id,
    },
    risk_level: 'high',
  });

  return jsonResponse({ success: true, data: { status: 'revoked' } });
}

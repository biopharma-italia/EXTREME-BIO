/**
 * ============================================================================
 * POST /api/admin/reports/bulk-release — Release multiple reports
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../../_middleware';
import { validateUuid } from '../../../../src/lib/validators';
import type { RequestContext } from '../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RESEND_API_KEY: string;
  APP_URL: string;
  EMAIL_FROM: string;
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  // Ostetrica cannot release (cannot modify reports)
  const authError = requireRole(ctx, 'lab_technician', 'admin', 'super_admin');
  if (authError) return authError;

  let body: { report_ids?: string[]; notify_channels?: string[] };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  if (!body.report_ids || !Array.isArray(body.report_ids) || body.report_ids.length === 0) {
    return jsonResponse({ success: false, error: 'Specificare almeno un ID referto.' }, 400);
  }

  if (body.report_ids.length > 50) {
    return jsonResponse({ success: false, error: 'Massimo 50 referti per operazione.' }, 400);
  }

  for (const id of body.report_ids) {
    if (!validateUuid(id)) {
      return jsonResponse({ success: false, error: `ID non valido: ${id}` }, 400);
    }
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const channels = body.notify_channels || ['email'];
  let released = 0;
  let notificationsQueued = 0;

  for (const reportId of body.report_ids) {
    const { data: report } = await adminClient
      .from('reports')
      .select(`id, status, report_number, report_type, sample_date, patient_id,
               patient:users!reports_patient_id_fkey(id, email, first_name)`)
      .eq('id', reportId)
      .eq('status', 'signed')
      .single();

    if (!report) continue;

    await adminClient.from('reports').update({
      status: 'released',
      released_by: ctx.user!.id,
      released_at: new Date().toISOString(),
      patient_notified: true,
      patient_notified_at: new Date().toISOString(),
    }).eq('id', reportId);

    released++;

    const patient = report.patient as { id: string; email: string; first_name: string };

    for (const channel of channels) {
      await adminClient.from('notifications').insert({
        user_id: patient.id,
        channel,
        subject: 'Nuovo referto disponibile',
        body: `Gentile ${patient.first_name}, il referto ${report.report_type} del ${report.sample_date} è disponibile.`,
        report_id: reportId,
        action_url: `/dashboard/referto/${reportId}`,
        status: 'queued',
        provider: channel === 'email' ? 'resend' : null,
      });
      notificationsQueued++;
    }
  }

  // Audit log
  await adminClient.from('audit_log').insert({
    user_id: ctx.user!.id,
    user_role: ctx.user!.role,
    action: 'report_release',
    target_type: 'report',
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: { bulk: true, total_requested: body.report_ids.length, released, channels },
    risk_level: 'medium',
  });

  return jsonResponse({
    success: true,
    released,
    notifications_queued: notificationsQueued,
  });
}

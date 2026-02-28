/**
 * ============================================================================
 * POST /api/reports/[id]/release
 * ============================================================================
 * Releases a signed report to the patient and triggers notifications.
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
  params: { id: string };
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data, params } = context;
  const { ctx, env } = data;

  // Ostetrica cannot release (cannot modify reports)
  const authError = requireRole(ctx, 'lab_technician', 'admin', 'super_admin');
  if (authError) return authError;

  const reportId = params.id;
  if (!validateUuid(reportId)) {
    return jsonResponse({ success: false, error: 'ID referto non valido.' }, 400);
  }

  let body: { notify_channels?: string[]; custom_message?: string } = {};
  try {
    body = await request.json();
  } catch { /* empty body ok */ }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get report + patient info
  const { data: report } = await adminClient
    .from('reports')
    .select(`
      id, status, report_number, report_type, sample_date, patient_id,
      patient:users!reports_patient_id_fkey(id, email, first_name, last_name, preferred_notification_channel)
    `)
    .eq('id', reportId)
    .single();

  if (!report) {
    return jsonResponse({ success: false, error: 'Referto non trovato.' }, 404);
  }

  if (report.status !== 'signed') {
    return jsonResponse({
      success: false,
      error: `Impossibile rilasciare: lo stato attuale è '${report.status}', deve essere 'signed'.`,
    }, 400);
  }

  // Update report status
  await adminClient.from('reports').update({
    status: 'released',
    released_by: ctx.user!.id,
    released_at: new Date().toISOString(),
    patient_notified: true,
    patient_notified_at: new Date().toISOString(),
  }).eq('id', reportId);

  // Queue notifications
  const channels = body.notify_channels || ['email', 'in_app'];
  const patient = report.patient as { id: string; email: string; first_name: string; last_name: string };
  let notificationsQueued = 0;

  for (const channel of channels) {
    const notifBody = body.custom_message ||
      `Gentile ${patient.first_name}, il suo referto ${report.report_type} del ${report.sample_date} è disponibile.`;

    await adminClient.from('notifications').insert({
      user_id: patient.id,
      channel,
      subject: 'Nuovo referto disponibile',
      body: notifBody,
      body_html: `<p>${notifBody}</p><p><a href="${env.APP_URL || 'https://referti.bio-clinic.it'}/dashboard/referto/${reportId}">Visualizza referto</a></p>`,
      report_id: reportId,
      action_url: `/dashboard/referto/${reportId}`,
      status: 'queued',
      provider: channel === 'email' ? 'resend' : channel === 'sms' ? 'twilio' : null,
    });
    notificationsQueued++;
  }

  // Send email notification immediately if email is in channels
  console.log('[Release] Email check — RESEND_API_KEY:', env.RESEND_API_KEY ? `set (${env.RESEND_API_KEY.substring(0, 6)}...)` : 'NOT SET', '| patient.email:', patient.email || 'none');
  if (channels.includes('email') && patient.email && env.RESEND_API_KEY) {
    try {
      const emailFrom = env.EMAIL_FROM || 'Bio-Clinic Referti <referti@bio-clinic.it>';
      const appUrl = env.APP_URL || 'https://referti.bio-clinic.it';

      const emailResp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: emailFrom,
          to: patient.email,
          subject: `Referto disponibile — ${report.report_number}`,
          html: `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f7f9fc;padding:20px">
  <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <div style="text-align:center;margin-bottom:24px">
      <div style="background:#00704A;color:white;display:inline-block;padding:8px 20px;border-radius:8px;font-size:18px;font-weight:600">
        Bio-Clinic Sassari
      </div>
    </div>
    <h2 style="color:#1a1a2e;margin:0 0 16px">Nuovo referto disponibile</h2>
    <p style="color:#444;line-height:1.6">
      Gentile <strong>${patient.first_name} ${patient.last_name}</strong>,
    </p>
    <p style="color:#444;line-height:1.6">
      Il suo referto \u00e8 ora disponibile per la consultazione e il download.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
      <tr style="background:#f0faf5">
        <td style="padding:10px 14px;font-weight:600;color:#555;border:1px solid #e0e0e0">N. Referto</td>
        <td style="padding:10px 14px;border:1px solid #e0e0e0"><strong>${report.report_number}</strong></td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-weight:600;color:#555;border:1px solid #e0e0e0">Tipo Esame</td>
        <td style="padding:10px 14px;border:1px solid #e0e0e0">${report.report_type || '--'}</td>
      </tr>
      <tr style="background:#f0faf5">
        <td style="padding:10px 14px;font-weight:600;color:#555;border:1px solid #e0e0e0">Data Prelievo</td>
        <td style="padding:10px 14px;border:1px solid #e0e0e0">${report.sample_date || '--'}</td>
      </tr>
    </table>
    <div style="text-align:center;margin:28px 0">
      <a href="${appUrl}/dashboard/"
         style="background:#00704A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px">
        Visualizza e Scarica Referto
      </a>
    </div>
    <p style="color:#888;font-size:12px;line-height:1.5;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
      Questo messaggio \u00e8 stato inviato automaticamente dal sistema Referti Online di Bio-Clinic Sassari.<br>
      Per assistenza: <a href="mailto:gestione@bio-clinic.it" style="color:#00704A">gestione@bio-clinic.it</a>
    </p>
  </div>
</body>
</html>`,
        }),
      });

      const emailSent = emailResp.ok;
      if (!emailSent) {
        console.error('[Release] Email send failed:', emailResp.status, await emailResp.text());
      } else {
        console.log('[Release] Email sent successfully to:', patient.email);
      }

      // Update notification status
      await adminClient.from('notifications')
        .update({ status: emailSent ? 'sent' : 'failed', sent_at: emailSent ? new Date().toISOString() : null })
        .eq('report_id', reportId)
        .eq('channel', 'email')
        .eq('status', 'queued');
    } catch (err) {
      console.error('[Release] Email error:', err);
    }
  } else if (!env.RESEND_API_KEY) {
    console.warn('[Release] RESEND_API_KEY not configured — skipping email for report', report.report_number);
  }

  // Audit log
  await adminClient.from('audit_log').insert({
    user_id: ctx.user!.id,
    user_role: ctx.user!.role,
    action: 'report_release',
    target_type: 'report',
    target_id: reportId,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: {
      report_number: report.report_number,
      patient_id: patient.id,
      channels,
      notifications_queued: notificationsQueued,
    },
    risk_level: 'medium',
  });

  return jsonResponse({
    success: true,
    data: {
      status: 'released',
      released_at: new Date().toISOString(),
      notifications_queued: notificationsQueued,
    },
  });
}

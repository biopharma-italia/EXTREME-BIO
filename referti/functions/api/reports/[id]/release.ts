/**
 * ============================================================================
 * POST /api/reports/[id]/release
 * ============================================================================
 * Releases a signed report to the patient and triggers notifications.
 * Sends: in_app + email (Resend) + WhatsApp (WASenderAPI)
 *
 * @version 2.0.0 — 2026-08-18 — Added WhatsApp via WASenderAPI
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../../_middleware';
import { validateUuid } from '../../../../src/lib/validators';
import { reportReleasedEmail } from '../../../../src/lib/email-templates';
import { sendWhatsApp, messageReportReleased } from '../../../../src/lib/whatsapp';
import type { WhatsAppEnv } from '../../../../src/lib/whatsapp';
import type { RequestContext } from '../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RESEND_API_KEY: string;
  APP_URL: string;
  EMAIL_FROM: string;
  WASENDER_API_KEY: string;
  WASENDER_SESSION_ID: string;
  WASENDER_BASE_URL: string;
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

  // Get report + patient info (including phone for WhatsApp)
  const { data: report } = await adminClient
    .from('reports')
    .select(`
      id, status, report_number, report_type, sample_date, patient_id,
      patient:users!reports_patient_id_fkey(id, email, first_name, last_name, phone, preferred_notification_channel)
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
  const channels = body.notify_channels || ['email', 'in_app', 'whatsapp'];
  const patient = report.patient as unknown as { id: string; email: string; first_name: string; last_name: string; phone: string | null };
  let notificationsQueued = 0;

  for (const channel of channels) {
    if (channel === 'whatsapp') continue; // WhatsApp handled separately below
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
      provider: channel === 'email' ? 'resend' : channel === 'sms' ? 'telnyx' : null,
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
          html: reportReleasedEmail(
            `${patient.first_name} ${patient.last_name}`,
            report.report_number,
            report.report_type || '--',
            report.sample_date || '--',
            appUrl
          ),
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

  // ── Send WhatsApp via WASenderAPI ──────────────────────────────────────────
  let whatsappSent = false;

  if ((channels.includes('whatsapp') || !body.notify_channels) && patient.phone) {
    console.log('[Release] WhatsApp check — WASENDER_API_KEY:',
      env.WASENDER_API_KEY ? `set (${env.WASENDER_API_KEY.substring(0, 8)}...)` : 'NOT SET',
      '| patient phone:', patient.phone);

    const waMessage = messageReportReleased({
      phone: patient.phone,
      firstName: patient.first_name,
      lastName: patient.last_name,
      reportNumber: report.report_number,
    });

    const waResult = await sendWhatsApp(env as unknown as WhatsAppEnv, patient.phone, waMessage);

    if (waResult.success) {
      whatsappSent = true;
      console.log('[Release] WhatsApp sent successfully to:', patient.phone);
    } else if (waResult.skipped) {
      console.log('[Release] WhatsApp skipped:', waResult.skip_reason);
    } else {
      console.error('[Release] WhatsApp failed:', waResult.error);
    }

    // Log WhatsApp notification in DB
    await adminClient.from('notifications').insert({
      user_id: patient.id,
      channel: 'whatsapp',
      subject: 'Nuovo referto disponibile',
      body: waMessage,
      report_id: reportId,
      action_url: `/dashboard/referto/${reportId}`,
      status: waResult.success ? 'sent' : 'failed',
      provider: 'wasenderapi',
      provider_id: waResult.provider_id || null,
      sent_at: waResult.success ? new Date().toISOString() : null,
      failure_reason: waResult.error || waResult.skip_reason || null,
    });
    notificationsQueued++;
  } else if (!patient.phone) {
    console.log('[Release] WhatsApp skipped — patient has no phone number');
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
      whatsapp_sent: whatsappSent,
    },
    risk_level: 'medium',
  });

  return jsonResponse({
    success: true,
    data: {
      status: 'released',
      released_at: new Date().toISOString(),
      notifications_queued: notificationsQueued,
      whatsapp_sent: whatsappSent,
    },
  });
}

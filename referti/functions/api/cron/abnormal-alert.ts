/**
 * ============================================================================
 * POST /api/cron/abnormal-alert
 * ============================================================================
 * Clinical safety net: alerts the staff when a report flagged with ABNORMAL
 * VALUES has not been viewed/downloaded by the patient 48h after release.
 * The staff receives a digest email with patient contact details so they
 * can call the patient directly. Medical-legal value: documented follow-up
 * attempt for abnormal results.
 *
 * Security: X-Cron-Secret header OR GitHub Actions OIDC token (shared helper).
 * Schedule: hourly via .github/workflows/referti-reminders-cron.yml (step 6).
 * Window:   09:00–19:00 Europe/Rome (staff working hours).
 *
 * Rules:
 * - Report has_abnormal_values=true OR is_urgent=true
 * - status='released', not viewed, not downloaded, not deleted
 * - Released more than 48h ago (no stale cap: abnormal results NEVER expire —
 *   staff must be notified even for old ones, once)
 * - Only 1 alert per report ever (dedup via notifications subject marker)
 * - Digest: one email per run listing up to 20 reports
 * - Recipients: active staff (lab_technician, admin, ostetrica) with email
 *
 * @version 1.0.0 — 2026-08-25
 */

import { createClient } from '@supabase/supabase-js';
import { isWithinReminderHours } from '../../../src/lib/whatsapp';
import { isCronAuthorized } from '../../../src/lib/cron-auth';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  APP_URL: string;
  CRON_SECRET: string;
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  WASENDER_API_KEY: string;
  WASENDER_SESSION_ID: string;
  WASENDER_BASE_URL: string;
}

const ALERT_AFTER_HOURS = 48;
const MAX_REPORTS_PER_DIGEST = 20;
const SUBJECT = 'Alert referto anomalo non visualizzato';

function titleCase(s: string | null): string {
  const v = (s || '').trim();
  if (!v) return '';
  return v.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function hoursSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
}

interface AlertRow {
  report_number: string;
  report_type: string;
  released_at: string;
  is_urgent: boolean;
  patient_name: string;
  patient_phone: string;
  patient_email: string;
}

function buildDigestHtml(rows: AlertRow[], appUrl: string): string {
  const tr = rows.map((r) => `
      <tr>
        <td style="padding:8px 10px;border:1px solid #e0e0e0"><strong>${r.report_number}</strong>${r.is_urgent ? ' <span style="color:#dc2626;font-weight:700">URGENTE</span>' : ''}</td>
        <td style="padding:8px 10px;border:1px solid #e0e0e0">${r.report_type}</td>
        <td style="padding:8px 10px;border:1px solid #e0e0e0">${r.patient_name}</td>
        <td style="padding:8px 10px;border:1px solid #e0e0e0">${r.patient_phone || '—'}<br><span style="color:#888;font-size:12px">${r.patient_email || ''}</span></td>
        <td style="padding:8px 10px;border:1px solid #e0e0e0;white-space:nowrap">${hoursSince(r.released_at)}h fa</td>
      </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;max-width:720px;margin:0 auto;background:#f7f9fc;padding:20px">
  <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <div style="text-align:center;margin-bottom:20px">
      <div style="background:#dc2626;color:white;display:inline-block;padding:8px 20px;border-radius:8px;font-size:16px;font-weight:600">
        ⚠️ Referti con valori anomali non visualizzati
      </div>
    </div>
    <p style="color:#444;line-height:1.6">
      I seguenti referti con <strong>valori fuori norma</strong> sono stati rilasciati da oltre ${ALERT_AFTER_HOURS} ore
      ma <strong>non risultano ancora visualizzati né scaricati</strong> dal paziente.
      Si consiglia di <strong>contattare telefonicamente il paziente</strong>.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:18px 0;font-size:13px">
      <tr style="background:#fef2f2">
        <th style="padding:8px 10px;border:1px solid #e0e0e0;text-align:left">Referto</th>
        <th style="padding:8px 10px;border:1px solid #e0e0e0;text-align:left">Tipo</th>
        <th style="padding:8px 10px;border:1px solid #e0e0e0;text-align:left">Paziente</th>
        <th style="padding:8px 10px;border:1px solid #e0e0e0;text-align:left">Contatti</th>
        <th style="padding:8px 10px;border:1px solid #e0e0e0;text-align:left">Rilasciato</th>
      </tr>${tr}
    </table>
    <div style="text-align:center;margin:24px 0">
      <a href="${appUrl}/dashboard/#reports"
         style="background:#00704A;color:white;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;display:inline-block">
        Apri la dashboard referti
      </a>
    </div>
    <p style="color:#999;font-size:12px;text-align:center">
      Messaggio automatico del portale referti Bio-Clinic — ogni referto viene segnalato una sola volta.<br>
      Dopo il contatto telefonico, annotare l'esito secondo la procedura interna.
    </p>
  </div>
</body>
</html>`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const jsonHeaders = { 'Content-Type': 'application/json' };

  if (!(await isCronAuthorized(request, env, 'abnormal-alert'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
  }

  if (!isWithinReminderHours()) {
    return new Response(JSON.stringify({
      success: true,
      message: 'Outside staff hours (09:00-19:00 Europe/Rome). No alerts sent.',
      alerted: 0,
    }), { status: 200, headers: jsonHeaders });
  }

  if (!env.RESEND_API_KEY) {
    return new Response(JSON.stringify({ success: false, error: 'RESEND_API_KEY not configured' }), {
      status: 500, headers: jsonHeaders,
    });
  }

  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const cutoff = new Date(Date.now() - ALERT_AFTER_HOURS * 3600000).toISOString();

  // ── Abnormal/urgent unopened reports released >48h ago ─────────────────────
  const { data: reports, error: qErr } = await db
    .from('reports')
    .select(`
      id, report_number, report_type, released_at, is_urgent, has_abnormal_values,
      patient:users!reports_patient_id_fkey(id, first_name, last_name, email, phone)
    `)
    .eq('status', 'released')
    .eq('patient_downloaded', false)
    .eq('patient_viewed', false)
    .is('deleted_at', null)
    .lt('released_at', cutoff)
    .or('has_abnormal_values.eq.true,is_urgent.eq.true')
    .order('released_at', { ascending: true })
    .limit(100);

  if (qErr) {
    return new Response(JSON.stringify({ success: false, error: qErr.message }), { status: 500, headers: jsonHeaders });
  }

  if (!reports || reports.length === 0) {
    return new Response(JSON.stringify({
      success: true, message: 'No abnormal unopened reports.', alerted: 0,
    }), { status: 200, headers: jsonHeaders });
  }

  // ── Dedup: alert each report only once ever ────────────────────────────────
  const reportIds = reports.map((r) => r.id);
  const { data: alreadyAlerted } = await db
    .from('notifications')
    .select('report_id')
    .in('report_id', reportIds)
    .eq('subject', SUBJECT);

  const done = new Set((alreadyAlerted || []).map((n) => n.report_id));
  const newReports = reports.filter((r) => !done.has(r.id)).slice(0, MAX_REPORTS_PER_DIGEST);

  if (newReports.length === 0) {
    return new Response(JSON.stringify({
      success: true, message: 'All abnormal unopened reports already alerted.', checked: reports.length, alerted: 0,
    }), { status: 200, headers: jsonHeaders });
  }

  // ── Staff recipients ─────────────────────────────────────────────────────────
  const { data: staff } = await db
    .from('users')
    .select('id, email, first_name, role')
    .in('role', ['lab_technician', 'admin', 'ostetrica'])
    .eq('is_active', true)
    .not('email', 'is', null);

  const recipients = (staff || []).map((s) => s.email).filter(Boolean) as string[];
  if (recipients.length === 0) {
    return new Response(JSON.stringify({ success: false, error: 'No staff recipients with email.' }), {
      status: 500, headers: jsonHeaders,
    });
  }

  // ── Send digest email ────────────────────────────────────────────────────────
  const appUrl = env.APP_URL || 'https://referti.bio-clinic.it';
  const emailFrom = env.EMAIL_FROM || 'Bio-Clinic Referti <referti@bio-clinic.it>';

  const rows: AlertRow[] = newReports.map((r) => {
    const p = r.patient as unknown as { first_name: string; last_name: string; email: string | null; phone: string | null };
    return {
      report_number: r.report_number,
      report_type: r.report_type,
      released_at: r.released_at,
      is_urgent: Boolean(r.is_urgent),
      patient_name: `${titleCase(p?.first_name)} ${titleCase(p?.last_name)}`.trim() || '—',
      patient_phone: p?.phone || '',
      patient_email: p?.email || '',
    };
  });

  let emailOk = false;
  let emailErr: string | null = null;
  let providerId: string | null = null;
  try {
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.RESEND_API_KEY}` },
      body: JSON.stringify({
        from: emailFrom,
        to: recipients,
        subject: `⚠️ ${newReports.length} referti anomali non visualizzati — contattare i pazienti`,
        html: buildDigestHtml(rows, appUrl),
      }),
    });
    const respData = await resp.json().catch(() => ({})) as { id?: string; message?: string };
    emailOk = resp.ok;
    providerId = respData.id || null;
    if (!emailOk) emailErr = respData.message || `HTTP ${resp.status}`;
  } catch (e) {
    emailErr = (e as Error).message;
  }

  // ── Record dedup markers (one per report) + audit ───────────────────────────
  // The dedup rows are tied to the patient user (report owner) so the
  // /api/notifications listing of staff is not polluted; channel=email.
  const nowIso = new Date().toISOString();
  if (emailOk) {
    const markers = newReports.map((r) => {
      const p = r.patient as unknown as { id: string };
      return {
        user_id: p.id,
        channel: 'email',
        subject: SUBJECT,
        body: `Alert inviato allo staff: referto ${r.report_number} con valori anomali non visualizzato dopo ${ALERT_AFTER_HOURS}h.`,
        report_id: r.id,
        status: 'sent',
        provider: 'resend',
        provider_id: providerId,
        sent_at: nowIso,
        retry_count: 0,
        max_retries: 0,
      };
    });
    await db.from('notifications').insert(markers);
  }

  await db.from('audit_log').insert({
    user_id: null,
    user_role: null,
    action: 'notification_send',
    target_type: 'system',
    target_id: null,
    ip_address: request.headers.get('CF-Connecting-IP') || 'cron',
    user_agent: 'cron/abnormal-alert',
    request_id: crypto.randomUUID(),
    details: {
      type: 'abnormal_alert_cron',
      reports: newReports.map((r) => r.report_number),
      recipients_count: recipients.length,
      email_sent: emailOk,
      email_error: emailErr,
    },
    risk_level: 'medium',
  });

  return new Response(JSON.stringify({
    success: emailOk,
    message: emailOk
      ? `Alert digest sent to ${recipients.length} staff for ${newReports.length} reports.`
      : `Alert email failed: ${emailErr}`,
    alerted: emailOk ? newReports.length : 0,
    recipients: recipients.length,
    reports: newReports.map((r) => r.report_number),
    error: emailErr || undefined,
  }), { status: emailOk ? 200 : 500, headers: jsonHeaders });
};

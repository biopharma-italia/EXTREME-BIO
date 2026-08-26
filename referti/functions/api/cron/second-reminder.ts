/**
 * ============================================================================
 * POST /api/cron/second-reminder
 * ============================================================================
 * Second-touch reminder for reports still unopened 72h after release.
 * The first reminder (24h) goes via WhatsApp; this second touch switches
 * channel to EMAIL when the patient has an address (channel alternation
 * maximizes reach: WhatsApp may have failed, been rate-limited, or simply
 * ignored). Falls back to WhatsApp when the patient has no email.
 *
 * Security: X-Cron-Secret header OR GitHub Actions OIDC token (shared helper).
 * Schedule: hourly via .github/workflows/referti-reminders-cron.yml (step 5).
 * Window:   09:00–19:00 Europe/Rome (polite hours).
 *
 * Rules:
 * - Report released between 72h and 14 days ago
 * - status='released', not viewed, not downloaded, not deleted
 * - Only 1 second-reminder per report (dedup via notifications subject)
 * - Max 15 sends per run (email is cheap; WhatsApp fallback throttled 5.5s)
 * - WhatsApp fallback stops early on rate limit (never steal release quota)
 *
 * @version 1.0.0 — 2026-08-25
 */

import { createClient } from '@supabase/supabase-js';
import { sendWhatsApp, isWithinReminderHours } from '../../../src/lib/whatsapp';
import type { WhatsAppEnv } from '../../../src/lib/whatsapp';
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

const MAX_SENDS_PER_RUN = 15;
const MIN_HOURS = 72;         // at least 72h since release
const MAX_DAYS = 14;          // give up after 14 days (stale)
const SUBJECT = 'Secondo promemoria referto';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function titleCase(s: string | null): string {
  const v = (s || '').trim();
  if (!v) return '';
  return v.split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

function buildWhatsAppMessage(firstName: string | null, reportNumber: string): string {
  const name = titleCase((firstName || '').split(/\s+/)[0] || '');
  return (
    `Gentile ${name || 'paziente'}, le ricordiamo nuovamente che il suo referto ` +
    `${reportNumber} è disponibile da alcuni giorni sul portale Bio-Clinic e non risulta ancora visualizzato.\n\n` +
    `Può scaricarlo in ogni momento da qui:\n` +
    `🔗 https://referti.bio-clinic.it\n\n` +
    `Se ha difficoltà ad accedere, risponda a questo messaggio o chiami il laboratorio: saremo felici di aiutarla.\n\n` +
    `Bio-Clinic Sassari`
  );
}

function buildEmailHtml(firstName: string, lastName: string, reportNumber: string, sampleDate: string | null, appUrl: string): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f7f9fc;padding:20px">
  <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <div style="text-align:center;margin-bottom:24px">
      <div style="background:#00704A;color:white;display:inline-block;padding:8px 20px;border-radius:8px;font-size:18px;font-weight:600">
        Bio-Clinic Sassari
      </div>
    </div>
    <h2 style="color:#1a1a2e;margin:0 0 16px">Il suo referto la sta aspettando</h2>
    <p style="color:#444;line-height:1.6">
      Gentile <strong>${titleCase(firstName)} ${titleCase(lastName)}</strong>,
    </p>
    <p style="color:#444;line-height:1.6">
      le ricordiamo che il suo referto <strong>${reportNumber}</strong>${sampleDate ? ` (prelievo del ${sampleDate})` : ''}
      è disponibile da alcuni giorni sul portale referti e non risulta ancora visualizzato.
    </p>
    <div style="text-align:center;margin:28px 0">
      <a href="${appUrl}/dashboard/"
         style="background:#00704A;color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;display:inline-block">
        Visualizza il referto
      </a>
    </div>
    <p style="color:#777;font-size:13px;line-height:1.5">
      Se ha difficoltà ad accedere al portale, risponda a questa email o contatti il laboratorio:
      il nostro personale sarà felice di aiutarla.
    </p>
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
    <p style="color:#999;font-size:12px;text-align:center">
      Bio-Clinic Sassari — Laboratorio Analisi<br>
      Questo è un messaggio automatico del portale referti.
    </p>
  </div>
</body>
</html>`;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const jsonHeaders = { 'Content-Type': 'application/json' };

  if (!(await isCronAuthorized(request, env, 'second-reminder'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
  }

  if (!isWithinReminderHours()) {
    return new Response(JSON.stringify({
      success: true,
      message: 'Outside send hours (09:00-19:00 Europe/Rome). No second reminders sent.',
      sent: 0,
    }), { status: 200, headers: jsonHeaders });
  }

  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = Date.now();
  const minCutoff = new Date(now - MIN_HOURS * 3600000).toISOString();   // released before this
  const staleCutoff = new Date(now - MAX_DAYS * 86400000).toISOString(); // ...but after this

  // ── Eligible reports: unopened, released 72h-14d ago ────────────────────────
  const { data: reports, error: qErr } = await db
    .from('reports')
    .select(`
      id, report_number, report_type, sample_date, released_at,
      patient:users!reports_patient_id_fkey(id, first_name, last_name, email, phone, is_active)
    `)
    .eq('status', 'released')
    .eq('patient_downloaded', false)
    .eq('patient_viewed', false)
    .is('deleted_at', null)
    .lt('released_at', minCutoff)
    .gte('released_at', staleCutoff)
    .order('released_at', { ascending: true })
    .limit(MAX_SENDS_PER_RUN * 3);

  if (qErr) {
    return new Response(JSON.stringify({ success: false, error: qErr.message }), { status: 500, headers: jsonHeaders });
  }

  if (!reports || reports.length === 0) {
    return new Response(JSON.stringify({
      success: true, message: 'No reports eligible for second reminder.', sent: 0,
    }), { status: 200, headers: jsonHeaders });
  }

  // ── Dedup: exclude reports that already got a second reminder ──────────────
  const reportIds = reports.map((r) => r.id);
  const { data: alreadySent } = await db
    .from('notifications')
    .select('report_id')
    .in('report_id', reportIds)
    .eq('subject', SUBJECT);

  const done = new Set((alreadySent || []).map((n) => n.report_id));
  const candidates = reports
    .filter((r) => !done.has(r.id))
    .filter((r) => {
      const p = r.patient as unknown as { email: string | null; phone: string | null; is_active: boolean } | null;
      return p?.is_active && (p.email || p.phone);
    })
    .slice(0, MAX_SENDS_PER_RUN);

  if (candidates.length === 0) {
    return new Response(JSON.stringify({
      success: true, message: 'All eligible reports already second-reminded.', checked: reports.length, sent: 0,
    }), { status: 200, headers: jsonHeaders });
  }

  // ── Send: email preferred (channel alternation), WhatsApp fallback ─────────
  const appUrl = env.APP_URL || 'https://referti.bio-clinic.it';
  const emailFrom = env.EMAIL_FROM || 'Bio-Clinic Referti <referti@bio-clinic.it>';
  let sentEmail = 0;
  let sentWa = 0;
  let failed = 0;
  let waRateLimitHit = false;
  const results: { report: string; channel: string; success: boolean; error?: string }[] = [];

  for (const r of candidates) {
    const p = r.patient as unknown as {
      id: string; first_name: string; last_name: string; email: string | null; phone: string | null;
    };

    const useEmail = Boolean(env.RESEND_API_KEY && p.email);
    let ok = false;
    let providerId: string | null = null;
    let errMsg: string | null = null;
    const channel = useEmail ? 'email' : 'whatsapp';

    if (useEmail) {
      try {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.RESEND_API_KEY}` },
          body: JSON.stringify({
            from: emailFrom,
            to: p.email,
            subject: `Promemoria: il suo referto ${r.report_number} la sta aspettando`,
            html: buildEmailHtml(p.first_name, p.last_name, r.report_number, r.sample_date, appUrl),
          }),
        });
        const respData = await resp.json().catch(() => ({})) as { id?: string; message?: string };
        ok = resp.ok;
        providerId = respData.id || null;
        if (!ok) errMsg = respData.message || `HTTP ${resp.status}`;
      } catch (e) {
        errMsg = (e as Error).message;
      }
    } else if (p.phone && env.WASENDER_API_KEY && !waRateLimitHit) {
      // Throttle WhatsApp sends
      if (sentWa > 0) await delay(5500);
      const waResult = await sendWhatsApp(env as unknown as WhatsAppEnv, p.phone, buildWhatsAppMessage(p.first_name, r.report_number));
      ok = waResult.success;
      providerId = waResult.provider_id || null;
      errMsg = waResult.error || null;
      if (!ok && (errMsg || '').toLowerCase().includes('rate limit')) {
        waRateLimitHit = true;
      }
    } else {
      errMsg = waRateLimitHit ? 'skipped: rate limit hit earlier in batch' : 'no usable channel';
    }

    const nowIso = new Date().toISOString();
    // Dedup marker: skip it on transient rate-limit failures (or sends skipped
    // because the batch hit a rate limit) so the report stays eligible and is
    // automatically retried at the next hourly run. Permanent failures still
    // write the marker to avoid hammering broken contacts every hour.
    const isTransient = !ok && (errMsg || '').toLowerCase().includes('rate limit');
    if (!isTransient) {
      await db.from('notifications').insert({
        user_id: p.id,
        channel,
        subject: SUBJECT,
        body: useEmail
          ? `Secondo promemoria email per referto ${r.report_number}`
          : buildWhatsAppMessage(p.first_name, r.report_number),
        report_id: r.id,
        action_url: '/dashboard/#my-reports',
        status: ok ? 'sent' : 'failed',
        provider: useEmail ? 'resend' : 'wasenderapi',
        provider_id: providerId,
        sent_at: ok ? nowIso : null,
        failed_at: ok ? null : nowIso,
        failure_reason: ok ? null : (errMsg || 'unknown'),
        retry_count: 0,
        max_retries: 0,
      });
    }

    if (ok) {
      if (useEmail) sentEmail++; else sentWa++;
      results.push({ report: r.report_number, channel, success: true });
    } else {
      failed++;
      results.push({ report: r.report_number, channel, success: false, error: errMsg || 'unknown' });
    }
  }

  // ── Audit ───────────────────────────────────────────────────────────────────
  await db.from('audit_log').insert({
    user_id: null,
    user_role: null,
    action: 'notification_send',
    target_type: 'system',
    target_id: null,
    ip_address: request.headers.get('CF-Connecting-IP') || 'cron',
    user_agent: 'cron/second-reminder',
    request_id: crypto.randomUUID(),
    details: {
      type: 'second_reminder_cron',
      candidates: candidates.length,
      sent_email: sentEmail,
      sent_whatsapp: sentWa,
      failed,
      wa_rate_limit_hit: waRateLimitHit,
    },
    risk_level: 'low',
  });

  return new Response(JSON.stringify({
    success: true,
    message: `Second reminders: ${sentEmail} email, ${sentWa} WhatsApp, ${failed} failed.`,
    sent_email: sentEmail,
    sent_whatsapp: sentWa,
    failed,
    candidates: candidates.length,
    results,
  }), { status: 200, headers: jsonHeaders });
};

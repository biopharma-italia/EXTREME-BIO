/**
 * ============================================================================
 * POST /api/cron/review-request
 * ============================================================================
 * Sends a WhatsApp Google-review request to patients ~30-90 minutes after
 * they DOWNLOAD their report (peak satisfaction moment).
 *
 * Security: X-Cron-Secret header OR GitHub Actions OIDC token (shared helper).
 * Schedule: hourly via .github/workflows/referti-reminders-cron.yml (step 4).
 * Window:   09:00–19:00 Europe/Rome (same polite hours as reminders).
 *
 * Rules:
 * - Report downloaded between 30 and 90 minutes ago (patient_downloaded_at)
 * - Skip reports with abnormal values or urgent flag (insensitive to ask)
 * - Skip deleted / non-released reports
 * - Max 1 review request per patient every REVIEW_COOLDOWN_DAYS (180 days),
 *   deduped via notifications(channel=whatsapp, subject=REVIEW_SUBJECT)
 * - Patient must have a phone number
 * - Max 5 sends per run, 5.5s throttle, STOP immediately on rate limit
 *   (review requests must never steal quota from release notifications)
 * - Google policy compliant: link shown to everyone, private feedback
 *   channel offered in the same message (no review gating)
 *
 * @version 1.0.0 — 2026-08-25
 */

import { createClient } from '@supabase/supabase-js';
import { sendWhatsApp, isWithinReminderHours, formatPhoneE164 } from '../../../src/lib/whatsapp';
import type { WhatsAppEnv } from '../../../src/lib/whatsapp';
import { isCronAuthorized } from '../../../src/lib/cron-auth';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CRON_SECRET: string;
  WASENDER_API_KEY: string;
  WASENDER_SESSION_ID: string;
  WASENDER_BASE_URL: string;
}

const MAX_SENDS_PER_RUN = 5;
const WINDOW_MIN_MINUTES = 30;        // downloaded at least 30 min ago
const WINDOW_MAX_MINUTES = 24 * 60;   // ...but no more than 24h ago (catch-up:
                                      // downloads outside the 09-19 send window
                                      // or missed by a failed run are recovered
                                      // by later runs; dedupe prevents doubles)
const REVIEW_COOLDOWN_DAYS = 180; // max 1 request per patient per 6 months
const REVIEW_SUBJECT = 'Richiesta recensione Google';
const REVIEW_LINK = 'https://g.page/bioclinic-sassari/review';

/**
 * Names in the DB are stored ALL-CAPS and can be long compounds
 * ("AURORA GIOVANNA MARIA GRAZIA"). Use only the first word, title-cased.
 */
function displayName(firstName: string | null): string {
  const first = (firstName || '').trim().split(/\s+/)[0] || '';
  if (!first) return '';
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function buildMessage(firstName: string | null): string {
  const name = displayName(firstName);
  const greeting = name ? `Ciao ${name}! 👋` : 'Ciao! 👋';
  return (
    `${greeting} Il tuo referto è arrivato correttamente.\n\n` +
    `Da Bio-Clinic lavoriamo ogni giorno per offrirti un servizio rapido e accurato. ` +
    `Se ti sei trovato bene, ci faresti un grande regalo lasciando una recensione (bastano 30 secondi):\n` +
    `⭐ ${REVIEW_LINK}\n\n` +
    `Se invece c'è qualcosa che possiamo migliorare, rispondi pure a questo messaggio: ti leggiamo personalmente. 💙\n\n` +
    `Grazie, il team Bio-Clinic`
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const jsonHeaders = { 'Content-Type': 'application/json' };

  if (!(await isCronAuthorized(request, env, 'review-request'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
  }

  if (!isWithinReminderHours()) {
    return new Response(JSON.stringify({
      success: true,
      message: 'Outside send hours (09:00-19:00 Europe/Rome). No review requests sent.',
      sent: 0,
    }), { status: 200, headers: jsonHeaders });
  }

  if (!env.WASENDER_API_KEY) {
    return new Response(JSON.stringify({ success: false, error: 'WASENDER_API_KEY not configured' }), {
      status: 500, headers: jsonHeaders,
    });
  }

  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = Date.now();
  const windowStart = new Date(now - WINDOW_MAX_MINUTES * 60000).toISOString();
  const windowEnd = new Date(now - WINDOW_MIN_MINUTES * 60000).toISOString();
  const cooldownCutoff = new Date(now - REVIEW_COOLDOWN_DAYS * 86400000).toISOString();

  // ── 1) Reports downloaded 30-90 minutes ago ────────────────────────────────
  const { data: reports, error: qErr } = await db
    .from('reports')
    .select(`
      id, patient_id, report_number, patient_downloaded_at,
      has_abnormal_values, is_urgent, status, deleted_at,
      patient:users!reports_patient_id_fkey(id, first_name, phone, is_active)
    `)
    .eq('patient_downloaded', true)
    .gte('patient_downloaded_at', windowStart)
    .lte('patient_downloaded_at', windowEnd)
    .is('deleted_at', null)
    .eq('status', 'released')
    .order('patient_downloaded_at', { ascending: true })
    .limit(100);

  if (qErr) {
    return new Response(JSON.stringify({ success: false, error: qErr.message }), {
      status: 500, headers: jsonHeaders,
    });
  }

  // In-code filters: sensitivity + phone + dedupe per patient within batch
  const seenPatients = new Set<string>();
  const prelim = (reports || []).filter((r) => {
    if (r.has_abnormal_values || r.is_urgent) return false;
    const patient = r.patient as unknown as { id: string; first_name: string | null; phone: string | null; is_active: boolean } | null;
    if (!patient?.is_active) return false;
    if (!formatPhoneE164(patient.phone)) return false;
    if (seenPatients.has(patient.id)) return false;
    seenPatients.add(patient.id);
    return true;
  });

  if (prelim.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      message: 'No eligible downloads in the 30-90 min window.',
      checked: (reports || []).length,
      sent: 0,
    }), { status: 200, headers: jsonHeaders });
  }

  // ── 2) Cooldown: exclude patients already asked in the last 180 days ───────
  const patientIds = prelim.map((r) => (r.patient as unknown as { id: string }).id);
  const { data: recentAsks } = await db
    .from('notifications')
    .select('user_id')
    .eq('channel', 'whatsapp')
    .eq('subject', REVIEW_SUBJECT)
    .in('user_id', patientIds)
    .gte('created_at', cooldownCutoff);

  const alreadyAsked = new Set((recentAsks || []).map((n) => n.user_id));
  const candidates = prelim
    .filter((r) => !alreadyAsked.has((r.patient as unknown as { id: string }).id))
    .slice(0, MAX_SENDS_PER_RUN);

  if (candidates.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      message: 'All eligible patients already asked within cooldown.',
      checked: prelim.length,
      sent: 0,
    }), { status: 200, headers: jsonHeaders });
  }

  // ── 3) Send ─────────────────────────────────────────────────────────────────
  let sent = 0;
  let failed = 0;
  let rateLimitHit = false;
  const results: { report: string; success: boolean; error?: string }[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const r = candidates[i];
    const patient = r.patient as unknown as { id: string; first_name: string | null; phone: string };

    if (i > 0) await delay(5500);

    const body = buildMessage(patient.first_name);
    const waResult = await sendWhatsApp(env as unknown as WhatsAppEnv, patient.phone, body);
    const nowIso = new Date().toISOString();

    // Record notification (also serves as the cooldown marker; recorded even
    // on PERMANENT failure so a broken number is not hammered every hour.
    // Transient rate-limit failures write NO marker: the patient stays
    // eligible and is automatically retried at the next hourly run.
    const isRateLimited = !waResult.success
      && (waResult.error || '').toLowerCase().includes('rate limit');
    if (!isRateLimited) {
      await db.from('notifications').insert({
        user_id: patient.id,
        channel: 'whatsapp',
        subject: REVIEW_SUBJECT,
        body,
        report_id: r.id,
        status: waResult.success ? 'sent' : 'failed',
        provider: 'wasender',
        provider_id: waResult.provider_id || null,
        sent_at: waResult.success ? nowIso : null,
        failed_at: waResult.success ? null : nowIso,
        failure_reason: waResult.success ? null : (waResult.error || 'unknown'),
        retry_count: 0,
        max_retries: 0,
      });
    }

    if (waResult.success) {
      sent++;
      results.push({ report: r.report_number, success: true });
    } else {
      failed++;
      results.push({ report: r.report_number, success: false, error: waResult.error });
      if ((waResult.error || '').toLowerCase().includes('rate limit')) {
        rateLimitHit = true;
        console.warn('[review-request] Rate limit hit — stopping batch early');
        break;
      }
    }
  }

  // ── 4) Audit log ────────────────────────────────────────────────────────────
  await db.from('audit_log').insert({
    user_id: null,
    user_role: null,
    action: 'notification_send',
    target_type: 'system',
    target_id: null,
    ip_address: request.headers.get('CF-Connecting-IP') || 'cron',
    user_agent: 'cron/review-request',
    request_id: crypto.randomUUID(),
    details: {
      type: 'review_request_cron',
      candidates: candidates.length,
      sent,
      failed,
      rate_limit_hit: rateLimitHit,
    },
    risk_level: 'low',
  });

  return new Response(JSON.stringify({
    success: true,
    message: `Review requests: ${sent} sent, ${failed} failed${rateLimitHit ? ' (stopped early: rate limit)' : ''}.`,
    sent,
    failed,
    rate_limit_hit: rateLimitHit,
    candidates: candidates.length,
    results,
  }), { status: 200, headers: jsonHeaders });
};

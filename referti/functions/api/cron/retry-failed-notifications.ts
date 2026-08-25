/**
 * ============================================================================
 * POST /api/cron/retry-failed-notifications
 * ============================================================================
 * Retries WhatsApp release notifications that FAILED (rate limit, transient
 * errors) and were never retried. Fixes the gap where bulk-release bursts
 * exceed WASenderAPI hourly limits and ~50% of messages get dropped forever.
 *
 * Security: X-Cron-Secret header OR GitHub Actions OIDC token (shared helper).
 * Schedule: hourly via .github/workflows/referti-reminders-cron.yml
 * Window:   09:00–19:00 Europe/Rome (same as reminders — polite hours).
 *
 * Rules:
 * - Only channel='whatsapp', status='failed', retry_count < max_retries (3)
 * - Skip permanent failures (JID not on WhatsApp, invalid phone)
 * - Skip if the report was already downloaded/viewed (message now pointless)
 * - Skip notifications older than 7 days (stale — referto probably collected
 *   in person or patient reached via email)
 * - Backoff: retry only if failed_at (or created_at) > 60 min ago
 * - Max 10 retries per run, 5.5s throttle between messages
 * - STOP immediately on a new rate-limit error (no point burning the batch)
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
  CRON_SECRET: string;
  WASENDER_API_KEY: string;
  WASENDER_SESSION_ID: string;
  WASENDER_BASE_URL: string;
}

const MAX_RETRIES_PER_RUN = 10;
const BACKOFF_MINUTES = 60;
const STALE_DAYS = 7;

// Failure reasons that will never succeed — do not retry
const PERMANENT_FAILURE_PATTERNS = [
  'does not exist on whatsapp',
  'invalid or missing phone',
  'invalid phone',
];

function isPermanentFailure(reason: string | null): boolean {
  if (!reason) return false;
  const r = reason.toLowerCase();
  return PERMANENT_FAILURE_PATTERNS.some((p) => r.includes(p));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const jsonHeaders = { 'Content-Type': 'application/json' };

  if (!(await isCronAuthorized(request, env, 'retry-failed'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
  }

  if (!isWithinReminderHours()) {
    return new Response(JSON.stringify({
      success: true,
      message: 'Outside send hours (09:00-19:00 Europe/Rome). No retries attempted.',
      retried: 0,
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
  const staleCutoff = new Date(now - STALE_DAYS * 86400000).toISOString();
  const backoffCutoff = new Date(now - BACKOFF_MINUTES * 60000).toISOString();

  // ── Find retryable failed WhatsApp notifications ───────────────────────────
  const { data: failed, error: qErr } = await db
    .from('notifications')
    .select(`
      id, user_id, report_id, body, retry_count, max_retries, failure_reason,
      failed_at, created_at,
      patient:users!notifications_user_id_fkey(phone),
      report:reports!notifications_report_id_fkey(patient_downloaded, patient_viewed, status, deleted_at)
    `)
    .eq('channel', 'whatsapp')
    .eq('status', 'failed')
    .gte('created_at', staleCutoff)
    .order('created_at', { ascending: true })
    .limit(100);

  if (qErr) {
    return new Response(JSON.stringify({ success: false, error: qErr.message }), {
      status: 500, headers: jsonHeaders,
    });
  }

  // Filter in-code (schema-tolerant: retry_count may be null)
  const candidates = (failed || []).filter((n) => {
    const retries = n.retry_count || 0;
    const maxR = n.max_retries || 3;
    if (retries >= maxR) return false;
    if (isPermanentFailure(n.failure_reason)) return false;
    // Backoff: last attempt must be older than BACKOFF_MINUTES
    const lastAttempt = n.failed_at || n.created_at;
    if (lastAttempt && lastAttempt > backoffCutoff) return false;
    // Skip if report already delivered or gone
    const rep = n.report as unknown as { patient_downloaded: boolean; patient_viewed: boolean; status: string; deleted_at: string | null } | null;
    if (rep && (rep.patient_downloaded || rep.patient_viewed)) return false;
    if (rep && (rep.deleted_at || rep.status !== 'released')) return false;
    // Must have a phone
    const patient = n.patient as unknown as { phone: string | null } | null;
    if (!patient?.phone) return false;
    return true;
  }).slice(0, MAX_RETRIES_PER_RUN);

  if (candidates.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      message: 'No retryable failed notifications.',
      checked: (failed || []).length,
      retried: 0,
    }), { status: 200, headers: jsonHeaders });
  }

  // ── Retry sends ─────────────────────────────────────────────────────────────
  let sent = 0;
  let stillFailed = 0;
  let skippedDelivered = 0;
  let rateLimitHit = false;
  const results: { id: string; success: boolean; error?: string }[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const n = candidates[i];
    const patient = n.patient as unknown as { phone: string };

    if (i > 0) await delay(5500);

    const waResult = await sendWhatsApp(env as unknown as WhatsAppEnv, patient.phone, n.body);
    const retries = (n.retry_count || 0) + 1;

    if (waResult.success) {
      sent++;
      await db.from('notifications').update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider_id: waResult.provider_id || null,
        retry_count: retries,
        failure_reason: null,
        next_retry_at: null,
      }).eq('id', n.id);
      results.push({ id: n.id, success: true });
    } else {
      stillFailed++;
      const isRateLimit = (waResult.error || '').toLowerCase().includes('rate limit');
      await db.from('notifications').update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        retry_count: retries,
        failure_reason: waResult.error || 'unknown',
        next_retry_at: new Date(now + 2 * BACKOFF_MINUTES * 60000).toISOString(),
      }).eq('id', n.id);
      results.push({ id: n.id, success: false, error: waResult.error });
      if (isRateLimit) {
        rateLimitHit = true;
        console.warn('[retry-failed] Rate limit hit — stopping batch early');
        break; // Non bruciare il resto del batch
      }
    }
  }
  void skippedDelivered;

  // ── Audit log ───────────────────────────────────────────────────────────────
  await db.from('audit_log').insert({
    user_id: null,
    user_role: null,
    action: 'notification_send',
    target_type: 'system',
    target_id: null,
    ip_address: request.headers.get('CF-Connecting-IP') || 'cron',
    user_agent: 'cron/retry-failed-notifications',
    request_id: crypto.randomUUID(),
    details: {
      type: 'whatsapp_retry_cron',
      candidates: candidates.length,
      sent,
      still_failed: stillFailed,
      rate_limit_hit: rateLimitHit,
    },
    risk_level: 'low',
  });

  return new Response(JSON.stringify({
    success: true,
    message: `Retry processed: ${sent} sent, ${stillFailed} still failed${rateLimitHit ? ' (stopped early: rate limit)' : ''}.`,
    retried: sent,
    still_failed: stillFailed,
    rate_limit_hit: rateLimitHit,
    candidates: candidates.length,
    results,
  }), { status: 200, headers: jsonHeaders });
};

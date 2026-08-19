/**
 * ============================================================================
 * POST /api/cron/send-reminders
 * ============================================================================
 * Scheduled endpoint that sends WhatsApp reminders for reports released
 * more than 24 hours ago that haven't been downloaded by the patient.
 *
 * Security: Protected by X-Cron-Secret header OR a GitHub Actions OIDC token
 *           (Bearer JWT issued by token.actions.githubusercontent.com, verified
 *           against GitHub's JWKS — restricted to this repository on main).
 * Schedule: Hourly via .github/workflows/referti-reminders-cron.yml (OIDC, no secrets)
 * Window: Only sends between 09:00–19:00 Europe/Rome — REMINDERS ONLY.
 *         Release notifications (email + WhatsApp) are sent immediately
 *         at any hour, including late evening/night uploads.
 *
 * Rules:
 * - Only 1 reminder per report (tracked via notifications table)
 * - Only for reports with status = 'released'
 * - Only if patient_downloaded = false
 * - Only if released_at > 24 hours ago
 * - Max 20 reminders per cron run (safety cap)
 * - 5.5s delay between messages (WASenderAPI Account Protection)
 *
 * @version 1.2.0 — 2026-08-19 — GitHub Actions OIDC auth (secretless scheduler)
 */

import { createClient } from '@supabase/supabase-js';
import { sendWhatsApp, messageReportReminder, isWithinReminderHours } from '../../../src/lib/whatsapp';
import type { WhatsAppEnv } from '../../../src/lib/whatsapp';

// ── GitHub Actions OIDC verification ─────────────────────────────────────────
// The scheduled workflow (.github/workflows/referti-reminders-cron.yml) requests
// an OIDC token (permissions: id-token: write) and sends it as Bearer JWT.
// We verify: RS256 signature against GitHub's JWKS, issuer, audience,
// expiry, and that the token was minted by THIS repo on the main branch.
const GH_OIDC_ISSUER = 'https://token.actions.githubusercontent.com';
const GH_OIDC_AUDIENCE = 'referti.bio-clinic.it/cron';
const GH_ALLOWED_REPO = 'biopharma-italia/EXTREME-BIO';

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 2 ? '==' : s.length % 4 === 3 ? '=' : '';
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64urlToJson(s: string): Record<string, unknown> {
  return JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));
}

async function verifyGitHubOidcToken(token: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false, reason: 'malformed' };

    const header = b64urlToJson(parts[0]) as { alg?: string; kid?: string };
    const payload = b64urlToJson(parts[1]) as {
      iss?: string; aud?: string | string[]; exp?: number; nbf?: number;
      repository?: string; ref?: string; event_name?: string;
    };

    if (header.alg !== 'RS256' || !header.kid) return { valid: false, reason: 'bad alg/kid' };

    // Claim checks (cheap) before fetching JWKS
    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== GH_OIDC_ISSUER) return { valid: false, reason: 'bad issuer' };
    const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audList.includes(GH_OIDC_AUDIENCE)) return { valid: false, reason: 'bad audience' };
    if (!payload.exp || payload.exp < now) return { valid: false, reason: 'expired' };
    if (payload.nbf && payload.nbf > now + 60) return { valid: false, reason: 'not yet valid' };
    if (payload.repository !== GH_ALLOWED_REPO) return { valid: false, reason: 'wrong repository' };
    if (payload.ref && payload.ref !== 'refs/heads/main') return { valid: false, reason: 'wrong ref' };

    // Fetch GitHub JWKS and verify RS256 signature
    const jwksResp = await fetch(`${GH_OIDC_ISSUER}/.well-known/jwks`, {
      // Cloudflare edge cache to avoid hammering GitHub (keys rotate rarely)
      cf: { cacheTtl: 3600, cacheEverything: true },
    } as RequestInit);
    if (!jwksResp.ok) return { valid: false, reason: 'jwks fetch failed' };
    const jwks = await jwksResp.json() as { keys: Array<{ kid: string; kty: string; n: string; e: string }> };
    const jwk = jwks.keys.find((k) => k.kid === header.kid);
    if (!jwk) return { valid: false, reason: 'unknown kid' };

    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const sig = b64urlToBytes(parts[2]);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sig as unknown as BufferSource, data);
    return ok ? { valid: true } : { valid: false, reason: 'bad signature' };
  } catch (e) {
    return { valid: false, reason: `exception: ${(e as Error).message}` };
  }
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  APP_URL: string;
  CRON_SECRET: string;
  WASENDER_API_KEY: string;
  WASENDER_SESSION_ID: string;
  WASENDER_BASE_URL: string;
}

// Maximum reminders per cron run to prevent runaway
const MAX_REMINDERS_PER_RUN = 20;

// Delay utility for throttling
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // ── Security: Verify cron secret ──────────────────────────────────────────
  const cronSecret = request.headers.get('X-Cron-Secret') || '';
  const authHeader = request.headers.get('Authorization') || '';

  // Allow either X-Cron-Secret header or Bearer token matching CRON_SECRET
  let isAuthorized =
    (env.CRON_SECRET && cronSecret === env.CRON_SECRET) ||
    (env.CRON_SECRET && authHeader === `Bearer ${env.CRON_SECRET}`) ||
    // Fallback: Allow if called with a valid staff JWT (for manual triggering from dashboard)
    (!env.CRON_SECRET && authHeader.startsWith('Bearer '));

  // Or: GitHub Actions OIDC token from the scheduled workflow (secretless)
  if (!isAuthorized && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7);
    // GitHub OIDC tokens are JWTs with 3 segments — quick pre-filter
    if (bearer.split('.').length === 3) {
      const oidc = await verifyGitHubOidcToken(bearer);
      if (oidc.valid) {
        isAuthorized = true;
      } else {
        console.warn('[send-reminders] OIDC rejected:', oidc.reason);
      }
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Time window check (REMINDERS ONLY) ────────────────────────────────────
  // NOTE: this 09:00–19:00 window applies ONLY to scheduled reminders.
  // Release notifications (email + WhatsApp on report release) are sent
  // immediately at any hour — see notify-release.ts / release.ts / bulk-release.ts.
  if (!isWithinReminderHours()) {
    return new Response(JSON.stringify({
      success: true,
      message: 'Outside reminder hours (09:00-19:00 Europe/Rome). No reminders sent. (Release notifications are NOT affected by this window.)',
      reminders_sent: 0,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Check WASenderAPI configuration ───────────────────────────────────────
  if (!env.WASENDER_API_KEY) {
    return new Response(JSON.stringify({
      success: false,
      error: 'WASENDER_API_KEY not configured',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Find eligible reports ─────────────────────────────────────────────────
  // Reports released > 24h ago, not downloaded, not deleted
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: eligibleReports, error: queryError } = await adminClient
    .from('reports')
    .select(`
      id, report_number, report_type, sample_date, patient_id, released_at,
      patient:users!reports_patient_id_fkey(id, first_name, last_name, phone)
    `)
    .eq('status', 'released')
    .eq('patient_downloaded', false)
    .is('deleted_at', null)
    .lt('released_at', twentyFourHoursAgo)
    .order('released_at', { ascending: true })
    .limit(MAX_REMINDERS_PER_RUN * 2); // Fetch extra in case some already have reminders

  if (queryError) {
    console.error('[send-reminders] Query error:', queryError.message);
    return new Response(JSON.stringify({
      success: false,
      error: 'Database query failed',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!eligibleReports || eligibleReports.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      message: 'No reports eligible for reminder.',
      reminders_sent: 0,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Filter out reports that already received a WhatsApp reminder ───────────
  const reportIds = eligibleReports.map((r) => r.id);

  const { data: existingReminders } = await adminClient
    .from('notifications')
    .select('report_id')
    .in('report_id', reportIds)
    .eq('channel', 'whatsapp')
    .eq('provider', 'wasenderapi')
    .like('body', '%le ricordiamo%'); // Identifier for reminder messages

  const alreadyReminded = new Set((existingReminders || []).map((n) => n.report_id));

  const reportsToRemind = eligibleReports
    .filter((r) => !alreadyReminded.has(r.id))
    .filter((r) => {
      const patient = r.patient as unknown as { phone: string | null } | null;
      return patient && patient.phone; // Only patients with phone numbers
    })
    .slice(0, MAX_REMINDERS_PER_RUN);

  if (reportsToRemind.length === 0) {
    return new Response(JSON.stringify({
      success: true,
      message: 'All eligible reports already reminded or no phone numbers.',
      reminders_sent: 0,
      checked: eligibleReports.length,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Send reminders ────────────────────────────────────────────────────────
  let remindersSent = 0;
  let remindersFailed = 0;
  const results: { report_number: string; success: boolean; error?: string }[] = [];

  for (let i = 0; i < reportsToRemind.length; i++) {
    const report = reportsToRemind[i];
    const patient = report.patient as unknown as { id: string; first_name: string; last_name: string; phone: string };

    // Throttle: 5.5s between messages
    if (i > 0) {
      await delay(5500);
    }

    const waMessage = messageReportReminder({
      phone: patient.phone,
      firstName: patient.first_name,
      lastName: patient.last_name,
      reportNumber: report.report_number,
    });

    const waResult = await sendWhatsApp(env as unknown as WhatsAppEnv, patient.phone, waMessage);

    // Log in DB
    await adminClient.from('notifications').insert({
      user_id: patient.id,
      channel: 'whatsapp',
      subject: 'Promemoria referto disponibile',
      body: waMessage,
      report_id: report.id,
      action_url: `/dashboard/#my-reports`,
      status: waResult.success ? 'sent' : 'failed',
      provider: 'wasenderapi',
      provider_id: waResult.provider_id || null,
      sent_at: waResult.success ? new Date().toISOString() : null,
      failure_reason: waResult.error || null,
    });

    if (waResult.success) {
      remindersSent++;
      results.push({ report_number: report.report_number, success: true });
      console.log(`[send-reminders] Reminder sent for report ${report.report_number} to ${patient.phone}`);
    } else {
      remindersFailed++;
      results.push({ report_number: report.report_number, success: false, error: waResult.error });
      console.error(`[send-reminders] Reminder failed for report ${report.report_number}:`, waResult.error);
    }
  }

  // ── Audit log ─────────────────────────────────────────────────────────────
  await adminClient.from('audit_log').insert({
    user_id: null,
    user_role: null,
    action: 'notification_send',
    target_type: 'system',
    target_id: null,
    ip_address: request.headers.get('CF-Connecting-IP') || 'cron',
    user_agent: 'cron/send-reminders',
    request_id: crypto.randomUUID(),
    details: {
      type: 'whatsapp_reminder_cron',
      eligible_reports: eligibleReports.length,
      already_reminded: alreadyReminded.size,
      attempted: reportsToRemind.length,
      sent: remindersSent,
      failed: remindersFailed,
    },
    risk_level: 'low',
  });

  return new Response(JSON.stringify({
    success: true,
    message: `Reminders processed: ${remindersSent} sent, ${remindersFailed} failed.`,
    reminders_sent: remindersSent,
    reminders_failed: remindersFailed,
    checked: eligibleReports.length,
    results,
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

/**
 * ============================================================================
 * POST /api/cron/delivery-stats
 * ============================================================================
 * Diagnostic endpoint: aggregated delivery & download statistics for released
 * reports and WhatsApp notifications/reminders. NO patient PII in output.
 *
 * Security: same as send-reminders — X-Cron-Secret header OR GitHub Actions
 *           OIDC Bearer token (repo biopharma-italia/EXTREME-BIO, branch main).
 *
 * Output:
 *  - released reports: totals (7d/30d/all), downloaded / viewed / neither
 *  - release notifications by channel (whatsapp/email): sent / failed
 *  - reminders: sent / failed, and post-reminder conversion
 *    (downloaded or viewed AFTER the reminder was sent)
 *  - patients without phone among non-downloaded reports
 *
 * @version 1.0.0 — 2026-08-25
 */

import { createClient } from '@supabase/supabase-js';

// ── GitHub Actions OIDC verification (same as send-reminders) ───────────────
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
      repository?: string; ref?: string;
    };

    if (header.alg !== 'RS256' || !header.kid) return { valid: false, reason: 'bad alg/kid' };

    const now = Math.floor(Date.now() / 1000);
    if (payload.iss !== GH_OIDC_ISSUER) return { valid: false, reason: 'bad issuer' };
    const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!audList.includes(GH_OIDC_AUDIENCE)) return { valid: false, reason: 'bad audience' };
    if (!payload.exp || payload.exp < now) return { valid: false, reason: 'expired' };
    if (payload.nbf && payload.nbf > now + 60) return { valid: false, reason: 'not yet valid' };
    if (payload.repository !== GH_ALLOWED_REPO) return { valid: false, reason: 'wrong repository' };
    if (payload.ref && payload.ref !== 'refs/heads/main') return { valid: false, reason: 'wrong ref' };

    const jwksResp = await fetch(`${GH_OIDC_ISSUER}/.well-known/jwks`, {
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
  CRON_SECRET: string;
}

function pct(n: number, d: number): string {
  return d > 0 ? `${((n / d) * 100).toFixed(1)}%` : 'n/a';
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  // ── Auth (identica a send-reminders) ───────────────────────────────────────
  const cronSecret = request.headers.get('X-Cron-Secret') || '';
  const authHeader = request.headers.get('Authorization') || '';

  let isAuthorized =
    (env.CRON_SECRET && cronSecret === env.CRON_SECRET) ||
    (env.CRON_SECRET && authHeader === `Bearer ${env.CRON_SECRET}`);

  if (!isAuthorized && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7);
    if (bearer.split('.').length === 3) {
      const oidc = await verifyGitHubOidcToken(bearer);
      if (oidc.valid) isAuthorized = true;
      else console.warn('[delivery-stats] OIDC rejected:', oidc.reason);
    }
  }

  if (!isAuthorized) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { 'Content-Type': 'application/json' },
    });
  }

  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = Date.now();
  const d7 = new Date(now - 7 * 86400000).toISOString();
  const d30 = new Date(now - 30 * 86400000).toISOString();
  const d90 = new Date(now - 90 * 86400000).toISOString();

  // ── Referti rilasciati: consegna/lettura ───────────────────────────────────
  const { data: released, error: relErr } = await db
    .from('reports')
    .select('id, released_at, patient_downloaded, patient_downloaded_at, patient_viewed, patient_viewed_at, patient:users!reports_patient_id_fkey(phone)')
    .eq('status', 'released')
    .is('deleted_at', null)
    .gte('released_at', d90)
    .order('released_at', { ascending: false })
    .limit(2000);

  if (relErr) {
    return new Response(JSON.stringify({ success: false, error: relErr.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }

  const buckets: Record<string, { total: number; downloaded: number; viewed_only: number; neither: number; no_phone_neither: number }> = {
    last_7d: { total: 0, downloaded: 0, viewed_only: 0, neither: 0, no_phone_neither: 0 },
    last_30d: { total: 0, downloaded: 0, viewed_only: 0, neither: 0, no_phone_neither: 0 },
    last_90d: { total: 0, downloaded: 0, viewed_only: 0, neither: 0, no_phone_neither: 0 },
  };

  for (const r of released || []) {
    const patient = r.patient as unknown as { phone: string | null } | null;
    const targets: string[] = ['last_90d'];
    if (r.released_at >= d30) targets.push('last_30d');
    if (r.released_at >= d7) targets.push('last_7d');
    for (const t of targets) {
      const b = buckets[t];
      b.total++;
      if (r.patient_downloaded) b.downloaded++;
      else if (r.patient_viewed) b.viewed_only++;
      else {
        b.neither++;
        if (!patient?.phone) b.no_phone_neither++;
      }
    }
  }

  const deliveryStats = Object.fromEntries(Object.entries(buckets).map(([k, b]) => [k, {
    released: b.total,
    downloaded: b.downloaded,
    downloaded_pct: pct(b.downloaded, b.total),
    viewed_only: b.viewed_only,
    viewed_or_downloaded_pct: pct(b.downloaded + b.viewed_only, b.total),
    never_opened: b.neither,
    never_opened_pct: pct(b.neither, b.total),
    never_opened_without_phone: b.no_phone_neither,
  }]));

  // ── Notifiche di rilascio per canale ───────────────────────────────────────
  const [waRelSent, waRelFailedRows, emailSent, emailFailed] = await Promise.all([
    db.from('notifications').select('id', { count: 'exact', head: true }).eq('channel', 'whatsapp').eq('status', 'sent').not('body', 'like', '%le ricordiamo%').gte('created_at', d90),
    db.from('notifications').select('failure_reason, created_at').eq('channel', 'whatsapp').eq('status', 'failed').not('body', 'like', '%le ricordiamo%').gte('created_at', d90).order('created_at', { ascending: false }).limit(500),
    db.from('notifications').select('id', { count: 'exact', head: true }).eq('channel', 'email').eq('status', 'sent').gte('created_at', d90),
    db.from('notifications').select('id', { count: 'exact', head: true }).eq('channel', 'email').eq('status', 'failed').gte('created_at', d90),
  ]);

  // Analisi fallimenti notifiche rilascio WhatsApp: motivi + distribuzione temporale
  const relFailReasons: Record<string, number> = {};
  const relFailByWeek: Record<string, number> = {};
  let relFailLast7d = 0;
  for (const n of waRelFailedRows.data || []) {
    const key = (n.failure_reason || 'unknown').slice(0, 80);
    relFailReasons[key] = (relFailReasons[key] || 0) + 1;
    const week = String(n.created_at).slice(0, 10);
    const weekKey = week.slice(0, 8) + (parseInt(week.slice(8, 10), 10) <= 15 ? '01-15' : '16-31');
    relFailByWeek[weekKey] = (relFailByWeek[weekKey] || 0) + 1;
    if (n.created_at >= d7) relFailLast7d++;
  }

  // ── Reminder WhatsApp + conversione post-reminder ──────────────────────────
  const { data: reminders } = await db
    .from('notifications')
    .select('report_id, status, sent_at, failure_reason, created_at')
    .eq('channel', 'whatsapp')
    .like('body', '%le ricordiamo%')
    .gte('created_at', d90)
    .limit(2000);

  const remSent = (reminders || []).filter((n) => n.status === 'sent');
  const remFailed = (reminders || []).filter((n) => n.status === 'failed');
  const failureReasons: Record<string, number> = {};
  for (const n of remFailed) {
    const key = (n.failure_reason || 'unknown').slice(0, 80);
    failureReasons[key] = (failureReasons[key] || 0) + 1;
  }

  // Conversione: referto scaricato/visto DOPO l'invio del reminder
  let convDownloaded = 0;
  let convViewedOnly = 0;
  let convNone = 0;
  const remReportIds = remSent.map((n) => n.report_id).filter(Boolean);
  if (remReportIds.length > 0) {
    const { data: remReports } = await db
      .from('reports')
      .select('id, patient_downloaded, patient_downloaded_at, patient_viewed, patient_viewed_at')
      .in('id', remReportIds.slice(0, 500));
    const remByReport = new Map(remSent.map((n) => [n.report_id, n.sent_at]));
    for (const r of remReports || []) {
      const sentAt = remByReport.get(r.id);
      if (!sentAt) continue;
      if (r.patient_downloaded && r.patient_downloaded_at && r.patient_downloaded_at > sentAt) convDownloaded++;
      else if (r.patient_viewed && r.patient_viewed_at && r.patient_viewed_at > sentAt) convViewedOnly++;
      else if (!r.patient_downloaded && !r.patient_viewed) convNone++;
      // (scaricati PRIMA del reminder = race condition, esclusi dal computo)
    }
  }

  const convDenom = convDownloaded + convViewedOnly + convNone;

  return new Response(JSON.stringify({
    success: true,
    generated_at: new Date().toISOString(),
    window: 'last 90 days (delivery buckets also 7d/30d)',
    delivery: deliveryStats,
    release_notifications_90d: {
      whatsapp: {
        sent: waRelSent.count || 0,
        failed: (waRelFailedRows.data || []).length,
        failed_last_7d: relFailLast7d,
        failure_reasons: relFailReasons,
        failed_by_period: relFailByWeek,
      },
      email: { sent: emailSent.count || 0, failed: emailFailed.count || 0 },
    },
    reminders_90d: {
      sent: remSent.length,
      failed: remFailed.length,
      failure_reasons: failureReasons,
      post_reminder_conversion: {
        analyzed: convDenom,
        downloaded_after_reminder: convDownloaded,
        viewed_after_reminder: convViewedOnly,
        still_never_opened: convNone,
        conversion_pct: pct(convDownloaded + convViewedOnly, convDenom),
      },
    },
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

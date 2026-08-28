/**
 * ============================================================================
 * GET /api/admin/review-stats — Google review campaign stats for dashboard
 * ============================================================================
 * Real-time stats for the "Recensioni Google" admin panel:
 *   - Review requests sent (WhatsApp, subject 'Richiesta recensione Google')
 *   - Clicks on the tracked link /r/recensione (audit_log, target_type 'review_link')
 *   - Click-through rate
 *   - Current eligibility queue (same rules as cron/review-request.ts)
 *
 * Auth: admin / super_admin JWT via _middleware.
 * No patient PII in output (clicks are anonymous by design).
 *
 * @version 1.0.0 — 2026-08-26
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../_middleware';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

const REVIEW_SUBJECT = 'Richiesta recensione Google';
const COOLDOWN_DAYS = 180;
const WINDOW_MIN_MINUTES = 30;
const WINDOW_MAX_MINUTES = 24 * 60;

function startOfTodayRomeIso(): string {
  // Rome-local midnight expressed in UTC (handles CET/CEST)
  const now = new Date();
  const romeStr = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Rome' }); // YYYY-MM-DD
  // Determine Rome UTC offset at current time
  const romeHour = parseInt(now.toLocaleString('en-GB', { timeZone: 'Europe/Rome', hour: '2-digit', hour12: false }), 10);
  const utcHour = now.getUTCHours();
  let offset = romeHour - utcHour;
  if (offset > 12) offset -= 24;
  if (offset < -12) offset += 24;
  const midnightUtcMs = Date.parse(romeStr + 'T00:00:00Z') - offset * 3600000;
  return new Date(midnightUtcMs).toISOString();
}

export async function onRequestGet(context: {
  data: { ctx: RequestContext; env: Env };
}) {
  const { data } = context;
  const { ctx, env } = data;

  const authError = requireRole(ctx, 'admin', 'super_admin');
  if (authError) return authError;

  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const now = Date.now();
  const todayStart = startOfTodayRomeIso();
  const d7 = new Date(now - 7 * 86400000).toISOString();
  const d30 = new Date(now - 30 * 86400000).toISOString();
  const cooldownCutoff = new Date(now - COOLDOWN_DAYS * 86400000).toISOString();
  const windowStart = new Date(now - WINDOW_MAX_MINUTES * 60000).toISOString();
  const windowEnd = new Date(now - WINDOW_MIN_MINUTES * 60000).toISOString();

  // ── 1) Review requests (last 30 days is enough for the panel) ──────────────
  const { data: requests, error: reqErr } = await db
    .from('notifications')
    .select('id, status, created_at, failure_reason')
    .eq('channel', 'whatsapp')
    .eq('subject', REVIEW_SUBJECT)
    .gte('created_at', d30)
    .order('created_at', { ascending: false })
    .limit(1000);

  if (reqErr) return jsonResponse({ success: false, error: reqErr.message }, 500);

  const reqs = requests || [];
  const countIn = (arr: typeof reqs, since: string, status?: string) =>
    arr.filter((n) => n.created_at >= since && (!status || n.status === status)).length;

  // ── 2) Clicks on the tracked link (audit_log) ───────────────────────────────
  const { data: clicks, error: clkErr } = await db
    .from('audit_log')
    .select('id, created_at, user_agent, details')
    .eq('target_type', 'review_link')
    .gte('created_at', d30)
    .order('created_at', { ascending: false })
    .limit(500);

  if (clkErr) return jsonResponse({ success: false, error: clkErr.message }, 500);

  // Separate real clicks from bot/link-preview fetches (WaSender fetches the
  // URL with UA "node" to build the WhatsApp preview; curl = internal tests).
  const isBot = (ua: string | null): boolean => {
    const u = (ua || '').toLowerCase().trim();
    if (!u) return true;
    return /^(node|curl|wget|python)|bot|crawler|preview|facebookexternalhit|whatsapp|telegrambot|headless/.test(u);
  };

  const allClks = clicks || [];
  const clks = allClks.filter((c) => !isBot(c.user_agent));
  const bots = allClks.filter((c) => isBot(c.user_agent));
  const clickCountIn = (since: string) => clks.filter((c) => c.created_at >= since).length;
  const botCountIn = (since: string) => bots.filter((c) => c.created_at >= since).length;

  // Recent clicks detail (anonymous: time + device summary)
  const deviceOf = (ua: string | null): string => {
    const u = (ua || '').toLowerCase();
    if (!u) return 'sconosciuto';
    const os = u.includes('android') ? 'Android'
      : (u.includes('iphone') || u.includes('ipad')) ? 'iOS'
      : u.includes('windows') ? 'Windows'
      : u.includes('mac os') ? 'macOS'
      : u.includes('linux') ? 'Linux' : 'altro';
    const browser = u.includes('edg/') ? 'Edge'
      : (u.includes('chrome') && !u.includes('edg/')) ? 'Chrome'
      : u.includes('firefox') ? 'Firefox'
      : (u.includes('safari') && !u.includes('chrome')) ? 'Safari'
      : u.includes('curl') ? 'curl' : 'altro';
    return os + ' / ' + browser;
  };

  const recentClicks = clks.slice(0, 25).map((c) => ({
    at: c.created_at,
    device: deviceOf(c.user_agent),
    mobile: /android|iphone|ipad/i.test(c.user_agent || ''),
  }));

  // ── 3) Eligibility queue (same rules as the cron) ──────────────────────────
  const { data: dlReports } = await db
    .from('reports')
    .select(`
      id, patient_id, patient_downloaded_at, has_abnormal_values, is_urgent,
      patient:users!reports_patient_id_fkey(id, phone, is_active)
    `)
    .eq('patient_downloaded', true)
    .gte('patient_downloaded_at', windowStart)
    .is('deleted_at', null)
    .eq('status', 'released')
    .order('patient_downloaded_at', { ascending: true })
    .limit(200);

  const seen = new Set<string>();
  const prelim = (dlReports || []).filter((r) => {
    if (r.has_abnormal_values || r.is_urgent) return false;
    const p = r.patient as unknown as { id: string; phone: string | null; is_active: boolean } | null;
    if (!p?.is_active || !p.phone) return false;
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  let queueReady = 0;   // in the 30min-24h window, sendable next run
  let queueWaiting = 0; // downloaded <30 min ago, will enter window soon
  let queueCooldown = 0;

  if (prelim.length > 0) {
    const patientIds = prelim.map((r) => (r.patient as unknown as { id: string }).id);
    const { data: asked } = await db
      .from('notifications')
      .select('user_id')
      .eq('channel', 'whatsapp')
      .eq('subject', REVIEW_SUBJECT)
      .in('user_id', patientIds)
      .gte('created_at', cooldownCutoff);
    const askedSet = new Set((asked || []).map((n) => n.user_id));

    for (const r of prelim) {
      const pid = (r.patient as unknown as { id: string }).id;
      if (askedSet.has(pid)) { queueCooldown++; continue; }
      if ((r.patient_downloaded_at as string) <= windowEnd) queueReady++;
      else queueWaiting++;
    }
  }

  // ── 4) Assemble ─────────────────────────────────────────────────────────────
  const sent30 = countIn(reqs, d30, 'sent');
  const clicks30 = clickCountIn(d30);

  return jsonResponse({
    success: true,
    generated_at: new Date().toISOString(),
    review_link: 'https://referti.bio-clinic.it/r/recensione',
    gbp_baseline: { stars: 5.0, reviews: 459, noted_at: '2026-08-26' },
    requests: {
      today: { sent: countIn(reqs, todayStart, 'sent'), failed: countIn(reqs, todayStart, 'failed') },
      last_7d: { sent: countIn(reqs, d7, 'sent'), failed: countIn(reqs, d7, 'failed') },
      last_30d: { sent: sent30, failed: countIn(reqs, d30, 'failed') },
    },
    clicks: {
      today: clickCountIn(todayStart),
      last_7d: clickCountIn(d7),
      last_30d: clicks30,
      bot_previews_30d: botCountIn(d30),
      recent: recentClicks,
    },
    ctr_30d_pct: sent30 > 0 ? ((clicks30 / sent30) * 100).toFixed(1) + '%' : 'n/a',
    queue: {
      ready_next_run: queueReady,
      waiting_window: queueWaiting,
      skipped_cooldown: queueCooldown,
      max_per_run: 10,
    },
  }, 200);
}

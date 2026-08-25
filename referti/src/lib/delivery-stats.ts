/**
 * ============================================================================
 * Delivery statistics — shared computation
 * ============================================================================
 * Aggregated delivery & download statistics for released reports and
 * WhatsApp notifications/reminders. NO patient PII in output.
 *
 * Used by:
 *  - POST /api/cron/delivery-stats  (OIDC/cron — CI reporting)
 *  - GET  /api/admin/delivery-stats (staff JWT — dashboard panel)
 *
 * @version 1.0.0 — 2026-08-25 (extracted from cron/delivery-stats.ts)
 */

import type { SupabaseClient } from '@supabase/supabase-js';

function pct(n: number, d: number): string {
  return d > 0 ? `${((n / d) * 100).toFixed(1)}%` : 'n/a';
}

export interface DeliveryStatsResult {
  success: boolean;
  generated_at: string;
  window: string;
  delivery: Record<string, unknown>;
  release_notifications_90d: Record<string, unknown>;
  reminders_90d: Record<string, unknown>;
  error?: string;
}

export async function computeDeliveryStats(db: SupabaseClient): Promise<DeliveryStatsResult> {
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
    return {
      success: false, error: relErr.message,
      generated_at: new Date().toISOString(), window: '',
      delivery: {}, release_notifications_90d: {}, reminders_90d: {},
    };
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
  const [waRelSent, waRelFailedRows, waRelRecovered, emailSent, emailFailed] = await Promise.all([
    db.from('notifications').select('id', { count: 'exact', head: true }).eq('channel', 'whatsapp').eq('status', 'sent').not('body', 'like', '%le ricordiamo%').gte('created_at', d90),
    db.from('notifications').select('failure_reason, created_at, retry_count').eq('channel', 'whatsapp').eq('status', 'failed').not('body', 'like', '%le ricordiamo%').gte('created_at', d90).order('created_at', { ascending: false }).limit(500),
    db.from('notifications').select('id', { count: 'exact', head: true }).eq('channel', 'whatsapp').eq('status', 'sent').gt('retry_count', 0).gte('created_at', d90),
    db.from('notifications').select('id', { count: 'exact', head: true }).eq('channel', 'email').eq('status', 'sent').gte('created_at', d90),
    db.from('notifications').select('id', { count: 'exact', head: true }).eq('channel', 'email').eq('status', 'failed').gte('created_at', d90),
  ]);

  const relFailReasons: Record<string, number> = {};
  let relFailLast7d = 0;
  let retryExhausted = 0;
  for (const n of waRelFailedRows.data || []) {
    const key = (n.failure_reason || 'unknown').slice(0, 80);
    relFailReasons[key] = (relFailReasons[key] || 0) + 1;
    if (n.created_at >= d7) relFailLast7d++;
    if ((n.retry_count || 0) >= 3) retryExhausted++;
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
  const remFailureReasons: Record<string, number> = {};
  for (const n of remFailed) {
    const key = (n.failure_reason || 'unknown').slice(0, 80);
    remFailureReasons[key] = (remFailureReasons[key] || 0) + 1;
  }

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
    }
  }

  const convDenom = convDownloaded + convViewedOnly + convNone;

  return {
    success: true,
    generated_at: new Date().toISOString(),
    window: 'last 90 days (delivery buckets also 7d/30d)',
    delivery: deliveryStats,
    release_notifications_90d: {
      whatsapp: {
        sent: waRelSent.count || 0,
        recovered_by_retry: waRelRecovered.count || 0,
        failed: (waRelFailedRows.data || []).length,
        failed_last_7d: relFailLast7d,
        retry_exhausted: retryExhausted,
        failure_reasons: relFailReasons,
      },
      email: { sent: emailSent.count || 0, failed: emailFailed.count || 0 },
    },
    reminders_90d: {
      sent: remSent.length,
      failed: remFailed.length,
      failure_reasons: remFailureReasons,
      post_reminder_conversion: {
        analyzed: convDenom,
        downloaded_after_reminder: convDownloaded,
        viewed_after_reminder: convViewedOnly,
        still_never_opened: convNone,
        conversion_pct: pct(convDownloaded + convViewedOnly, convDenom),
      },
    },
  };
}

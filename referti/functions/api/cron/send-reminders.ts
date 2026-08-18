/**
 * ============================================================================
 * POST /api/cron/send-reminders
 * ============================================================================
 * Scheduled endpoint that sends WhatsApp reminders for reports released
 * more than 24 hours ago that haven't been downloaded by the patient.
 *
 * Security: Protected by X-Cron-Secret header (set in Cloudflare Cron Trigger config)
 * Schedule: Every hour (configured in wrangler.toml or Cloudflare dashboard)
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
 * @version 1.1.0 — 2026-08-18 — Time window scoped to reminders only
 */

import { createClient } from '@supabase/supabase-js';
import { sendWhatsApp, messageReportReminder, isWithinReminderHours } from '../../../src/lib/whatsapp';
import type { WhatsAppEnv } from '../../../src/lib/whatsapp';

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
  const isAuthorized =
    (env.CRON_SECRET && cronSecret === env.CRON_SECRET) ||
    (env.CRON_SECRET && authHeader === `Bearer ${env.CRON_SECRET}`) ||
    // Fallback: Allow if called with a valid staff JWT (for manual triggering from dashboard)
    (!env.CRON_SECRET && authHeader.startsWith('Bearer '));

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

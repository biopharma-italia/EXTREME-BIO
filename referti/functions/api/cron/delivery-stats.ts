/**
 * ============================================================================
 * POST /api/cron/delivery-stats
 * ============================================================================
 * Diagnostic endpoint: aggregated delivery & download statistics for released
 * reports and WhatsApp notifications/reminders. NO patient PII in output.
 *
 * Security: X-Cron-Secret header OR GitHub Actions OIDC Bearer token
 *           (shared helper src/lib/cron-auth.ts).
 * Stats computation shared with GET /api/admin/delivery-stats
 * (src/lib/delivery-stats.ts).
 *
 * @version 2.0.0 — 2026-08-25 — refactored to shared lib
 */

import { createClient } from '@supabase/supabase-js';
import { isCronAuthorized } from '../../../src/lib/cron-auth';
import { computeDeliveryStats } from '../../../src/lib/delivery-stats';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CRON_SECRET: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const jsonHeaders = { 'Content-Type': 'application/json' };

  if (!(await isCronAuthorized(request, env, 'delivery-stats'))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: jsonHeaders });
  }

  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const stats = await computeDeliveryStats(db);
  return new Response(JSON.stringify(stats, null, 2), {
    status: stats.success ? 200 : 500,
    headers: jsonHeaders,
  });
};

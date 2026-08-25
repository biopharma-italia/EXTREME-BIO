/**
 * ============================================================================
 * GET /api/admin/delivery-stats — Delivery & notification stats for dashboard
 * ============================================================================
 * Same aggregates as the cron endpoint, exposed to staff for the admin panel.
 * Auth: staff JWT via _middleware (lab_technician, admin, super_admin, ostetrica).
 * No patient PII in output.
 *
 * @version 1.0.0 — 2026-08-25
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../_middleware';
import { computeDeliveryStats } from '../../../src/lib/delivery-stats';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export async function onRequestGet(context: {
  data: { ctx: RequestContext; env: Env };
}) {
  const { data } = context;
  const { ctx, env } = data;

  const authError = requireRole(ctx, 'lab_technician', 'admin', 'super_admin', 'ostetrica');
  if (authError) return authError;

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const stats = await computeDeliveryStats(adminClient);
  return jsonResponse(stats, stats.success ? 200 : 500);
}

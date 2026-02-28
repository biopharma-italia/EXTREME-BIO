/**
 * ============================================================================
 * GET /api/admin/dashboard — Aggregated stats for admin/lab dashboard
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../_middleware';
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

  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

  // Parallel queries
  const [
    { count: totalReports },
    { count: pendingReports },
    { count: validatedReports },
    { count: signedReports },
    { count: releasedToday },
    { count: urgentPending },
    { count: abnormalPending },
    { count: totalPatients },
    { count: activeLast30d },
    { count: newToday },
    { count: notifQueued },
    { count: notifFailed },
    { count: totalFiles },
  ] = await Promise.all([
    adminClient.from('reports').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    adminClient.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending').is('deleted_at', null),
    adminClient.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'validated').is('deleted_at', null),
    adminClient.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'signed').is('deleted_at', null),
    adminClient.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'released').gte('released_at', today).is('deleted_at', null),
    adminClient.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('is_urgent', true).is('deleted_at', null),
    adminClient.from('reports').select('id', { count: 'exact', head: true }).in('status', ['pending', 'validated']).eq('has_abnormal_values', true).is('deleted_at', null),
    adminClient.from('users').select('id', { count: 'exact', head: true }).eq('role', 'patient').is('deleted_at', null),
    adminClient.from('users').select('id', { count: 'exact', head: true }).eq('role', 'patient').gte('last_login_at', thirtyDaysAgo).is('deleted_at', null),
    adminClient.from('users').select('id', { count: 'exact', head: true }).eq('role', 'patient').gte('created_at', today).is('deleted_at', null),
    adminClient.from('notifications').select('id', { count: 'exact', head: true }).eq('status', 'queued'),
    adminClient.from('notifications').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    adminClient.from('report_files').select('id', { count: 'exact', head: true }).is('deleted_at', null),
  ]);

  return jsonResponse({
    success: true,
    data: {
      reports: {
        total: totalReports || 0,
        pending: pendingReports || 0,
        validated: validatedReports || 0,
        signed: signedReports || 0,
        released_today: releasedToday || 0,
        urgent_pending: urgentPending || 0,
        abnormal_pending: abnormalPending || 0,
      },
      users: {
        total_patients: totalPatients || 0,
        active_last_30d: activeLast30d || 0,
        new_registrations_today: newToday || 0,
      },
      notifications: {
        queued: notifQueued || 0,
        failed: notifFailed || 0,
      },
      storage: {
        total_files: totalFiles || 0,
      },
    },
  });
}

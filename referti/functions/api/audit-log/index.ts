/**
 * ============================================================================
 * GET /api/audit-log — Audit log viewer (admin only)
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../_middleware';
import { validateDate, validateUuid } from '../../../src/lib/validators';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export async function onRequestGet(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  const authError = requireRole(ctx, 'admin', 'super_admin');
  if (authError) return authError;

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') || '50')));
  const offset = (page - 1) * perPage;

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let query = adminClient
    .from('audit_log')
    .select('*', { count: 'exact' });

  const userId = url.searchParams.get('user_id');
  if (userId && validateUuid(userId)) query = query.eq('user_id', userId);

  const action = url.searchParams.get('action');
  if (action) query = query.eq('action', action);

  const targetType = url.searchParams.get('target_type');
  if (targetType) query = query.eq('target_type', targetType);

  const targetId = url.searchParams.get('target_id');
  if (targetId && validateUuid(targetId)) query = query.eq('target_id', targetId);

  const riskLevel = url.searchParams.get('risk_level');
  if (riskLevel) query = query.eq('risk_level', riskLevel);

  const from = url.searchParams.get('from');
  if (from && validateDate(from)) query = query.gte('created_at', `${from}T00:00:00Z`);

  const to = url.searchParams.get('to');
  if (to && validateDate(to)) query = query.lte('created_at', `${to}T23:59:59Z`);

  query = query.order('created_at', { ascending: false }).range(offset, offset + perPage - 1);

  const { data: logs, error, count } = await query;

  if (error) {
    return jsonResponse({ success: false, error: 'Errore nel caricamento dei log.' }, 500);
  }

  return jsonResponse({
    success: true,
    data: logs,
    pagination: { page, per_page: perPage, total: count || 0, total_pages: Math.ceil((count || 0) / perPage) },
  });
}

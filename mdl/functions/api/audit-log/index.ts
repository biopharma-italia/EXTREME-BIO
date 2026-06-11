/**
 * GET /api/audit-log — Query audit log with filters
 *
 * Access: super_admin, medico_competente only (canViewAuditLog)
 *
 * Query params:
 *   action    — filter by action (e.g. user_create, visit_update)
 *   user_id   — filter by acting user
 *   target_id — filter by target entity
 *   date_from — ISO date lower bound
 *   date_to   — ISO date upper bound
 *   page      — pagination (default 1)
 *   limit     — items per page (default 50, max 200)
 */

import { canViewAuditLog } from '../lib/permissions';

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !canViewAuditLog(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action') || '';
  const userId = url.searchParams.get('user_id') || '';
  const targetId = url.searchParams.get('target_id') || '';
  const dateFrom = url.searchParams.get('date_from') || '';
  const dateTo = url.searchParams.get('date_to') || '';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 200);
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('mdl_audit_log')
    .select('*', { count: 'exact' });

  if (action) query = query.eq('action', action);
  if (userId) query = query.eq('user_id', userId);
  if (targetId) query = query.eq('target_id', targetId);
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', dateTo + 'T23:59:59');

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  // Enrich with user info (no FK available, so batch lookup)
  const userIds = [...new Set((data || []).map((l: any) => l.user_id).filter(Boolean))];
  let userMap: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: users } = await supabaseAdmin
      .from('mdl_users')
      .select('id, email, first_name, last_name')
      .in('id', userIds);
    (users || []).forEach((u: any) => { userMap[u.id] = u; });
  }

  const enriched = (data || []).map((l: any) => ({
    ...l,
    mdl_users: userMap[l.user_id] || null,
  }));

  return Response.json({
    success: true,
    data: enriched,
    pagination: { page, limit, total: count || 0, total_pages: Math.ceil((count || 0) / limit) },
  });
};

/**
 * ============================================================================
 * GET /api/notifications — List user's notifications
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_middleware';
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

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const perPage = Math.min(50, Math.max(1, parseInt(url.searchParams.get('per_page') || '20')));
  const offset = (page - 1) * perPage;

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let query = adminClient
    .from('notifications')
    .select('id, channel, subject, body, report_id, action_url, status, read_at, created_at', { count: 'exact' })
    .eq('user_id', ctx.user.id);

  const status = url.searchParams.get('status');
  if (status === 'unread') {
    query = query.is('read_at', null);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + perPage - 1);

  const { data: notifications, error, count } = await query;

  if (error) {
    return jsonResponse({ success: false, error: 'Errore nel caricamento delle notifiche.' }, 500);
  }

  // Get unread count
  const { count: unreadCount } = await adminClient
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', ctx.user.id)
    .is('read_at', null);

  return jsonResponse({
    success: true,
    data: notifications,
    unread_count: unreadCount || 0,
    pagination: { page, per_page: perPage, total: count || 0, total_pages: Math.ceil((count || 0) / perPage) },
  });
}

/**
 * ============================================================================
 * PATCH /api/notifications/[id]/read — Mark single notification as read
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../_middleware';
import { validateUuid } from '../../../../src/lib/validators';
import type { RequestContext } from '../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export async function onRequestPatch(context: {
  params: { id: string };
  data: { ctx: RequestContext; env: Env };
}) {
  const { data, params } = context;
  const { ctx, env } = data;

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  if (!validateUuid(params.id)) {
    return jsonResponse({ success: false, error: 'ID notifica non valido.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await adminClient
    .from('notifications')
    .update({ read_at: new Date().toISOString(), status: 'read' })
    .eq('id', params.id)
    .eq('user_id', ctx.user.id)
    .is('read_at', null);

  if (error) {
    return jsonResponse({ success: false, error: 'Errore.' }, 500);
  }

  return jsonResponse({ success: true });
}

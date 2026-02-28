/**
 * ============================================================================
 * POST /api/auth/refresh
 * ============================================================================
 * Refreshes the access token using a valid refresh token.
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_middleware';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { env } = data;

  let body: { refresh_token?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  if (!body.refresh_token) {
    return jsonResponse({ success: false, error: 'Refresh token obbligatorio.' }, 400);
  }

  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: session, error } = await supabase.auth.refreshSession({
    refresh_token: body.refresh_token,
  });

  if (error || !session.session) {
    return jsonResponse({ success: false, error: 'Refresh token non valido o scaduto.' }, 401);
  }

  return jsonResponse({
    success: true,
    access_token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    expires_in: session.session.expires_in || 3600,
  });
}

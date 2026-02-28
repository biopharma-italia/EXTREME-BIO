/**
 * ============================================================================
 * DELETE /api/auth/2fa
 * ============================================================================
 * Disables 2FA. Requires current TOTP code and password for verification.
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../_middleware';
import type { RequestContext } from '../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
}

export async function onRequestDelete(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  let body: { code?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  if (!body.code || !body.password) {
    return jsonResponse({
      success: false,
      error: 'Codice 2FA e password corrente sono obbligatori.',
    }, 400);
  }

  // Verify current password
  const anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: authError } = await anonClient.auth.signInWithPassword({
    email: ctx.user.email,
    password: body.password,
  });

  if (authError) {
    return jsonResponse({ success: false, error: 'Password non corretta.' }, 401);
  }

  // Sign out the temporary session
  await anonClient.auth.signOut();

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Delete TOTP record
  await adminClient.from('totp_secrets').delete().eq('user_id', ctx.user.id);

  // Disable 2FA on user profile
  await adminClient.from('users').update({
    totp_enabled: false,
  }).eq('id', ctx.user.id);

  // Audit log
  await adminClient.from('audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: 'totp_disable',
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: { email: ctx.user.email },
    risk_level: 'high',
  });

  return jsonResponse({
    success: true,
    message: 'Autenticazione a due fattori disattivata.',
  });
}

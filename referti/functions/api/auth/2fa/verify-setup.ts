/**
 * ============================================================================
 * POST /api/auth/2fa/verify-setup
 * ============================================================================
 * Confirms 2FA setup by verifying a TOTP code against the stored secret.
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../_middleware';
import { decryptTotpSecret } from '../../../../src/lib/encryption';
import type { RequestContext } from '../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  MASTER_ENCRYPTION_KEY: string;
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  if (!body.code || !/^\d{6}$/.test(body.code)) {
    return jsonResponse({ success: false, error: 'Codice a 6 cifre obbligatorio.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get unverified TOTP record
  const { data: totpRecord } = await adminClient
    .from('totp_secrets')
    .select('encrypted_secret')
    .eq('user_id', ctx.user.id)
    .eq('is_verified', false)
    .single();

  if (!totpRecord) {
    return jsonResponse({
      success: false,
      error: 'Nessuna configurazione 2FA in sospeso. Avviare prima il setup.',
    }, 404);
  }

  // Decrypt and verify
  try {
    const parts = totpRecord.encrypted_secret.split(':');
    const secret = await decryptTotpSecret(
      parts[0],
      parts[1] || '',
      env.MASTER_ENCRYPTION_KEY,
      ctx.user.id
    );

    const { authenticator } = await import('otplib');
    authenticator.options = { window: 1 };
    const isValid = authenticator.verify({ token: body.code, secret });

    if (!isValid) {
      return jsonResponse({ success: false, error: 'Codice non valido.' }, 401);
    }
  } catch (err) {
    console.error('[2FA] Verify setup error:', err);
    return jsonResponse({ success: false, error: 'Errore nella verifica.' }, 500);
  }

  // Mark as verified
  await adminClient.from('totp_secrets').update({
    is_verified: true,
    verified_at: new Date().toISOString(),
  }).eq('user_id', ctx.user.id);

  // Enable 2FA on user profile
  await adminClient.from('users').update({
    totp_enabled: true,
  }).eq('id', ctx.user.id);

  // Audit log
  await adminClient.from('audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: 'totp_enable',
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: { step: 'setup_verified' },
    risk_level: 'medium',
  });

  return jsonResponse({
    success: true,
    message: 'Autenticazione a due fattori attivata.',
  });
}

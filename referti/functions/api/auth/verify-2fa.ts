/**
 * ============================================================================
 * POST /api/auth/verify-2fa
 * ============================================================================
 * Verifies TOTP code or backup code after login.
 * Requires temp_token from login response.
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_middleware';
import { decryptTotpSecret } from '../../../src/lib/encryption';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_ANON_KEY: string;
  MASTER_ENCRYPTION_KEY: string;
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  let body: { code?: string; backup_code?: string; temp_token?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  // Extract temp_token from Authorization header or body
  const authHeader = request.headers.get('Authorization');
  const tempToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : body.temp_token;

  if (!tempToken) {
    return jsonResponse({ success: false, error: 'Token temporaneo mancante.' }, 401);
  }

  if (!body.code && !body.backup_code) {
    return jsonResponse({ success: false, error: 'Codice 2FA obbligatorio.' }, 400);
  }

  // Decode temp_token
  let payload: { sub: string; scope: string; email: string; exp: number };
  try {
    payload = JSON.parse(atob(tempToken));
  } catch {
    return jsonResponse({ success: false, error: 'Token non valido.' }, 401);
  }

  // Validate token
  if (payload.scope !== '2fa_pending') {
    return jsonResponse({ success: false, error: 'Token non valido per verifica 2FA.' }, 401);
  }

  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return jsonResponse({ success: false, error: 'Token scaduto. Effettua nuovamente il login.' }, 401);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get user profile and TOTP secret
  const { data: userProfile } = await adminClient
    .from('users')
    .select('id, role, failed_login_count')
    .eq('auth_id', payload.sub)
    .single();

  if (!userProfile) {
    return jsonResponse({ success: false, error: 'Utente non trovato.' }, 401);
  }

  const { data: totpRecord } = await adminClient
    .from('totp_secrets')
    .select('encrypted_secret, backup_codes, backup_codes_remaining')
    .eq('user_id', userProfile.id)
    .eq('is_verified', true)
    .single();

  if (!totpRecord) {
    return jsonResponse({ success: false, error: '2FA non configurato.' }, 401);
  }

  let verified = false;

  if (body.code) {
    // Verify TOTP code
    try {
      // Decrypt secret - we'll parse IV from stored format "encrypted:iv"
      const parts = totpRecord.encrypted_secret.split(':');
      const encryptedHex = parts[0];
      const ivHex = parts[1] || '';

      const secret = await decryptTotpSecret(
        encryptedHex,
        ivHex,
        env.MASTER_ENCRYPTION_KEY,
        userProfile.id
      );

      // Verify TOTP code (±1 time step tolerance)
      const { authenticator } = await import('otplib');
      authenticator.options = {
        window: 1, // ±1 time step (30s)
      };
      verified = authenticator.verify({ token: body.code, secret });
    } catch (err) {
      console.error('[2FA] TOTP verification error:', err);
      verified = false;
    }
  } else if (body.backup_code) {
    // Verify backup code
    try {
      const storedCodes: string[] = JSON.parse(totpRecord.backup_codes || '[]');
      const codeIndex = storedCodes.findIndex(
        (c: string) => c === body.backup_code
      );

      if (codeIndex >= 0) {
        verified = true;
        // Remove used backup code
        storedCodes.splice(codeIndex, 1);
        await adminClient.from('totp_secrets').update({
          backup_codes: JSON.stringify(storedCodes),
          backup_codes_remaining: (totpRecord.backup_codes_remaining || 0) - 1,
        }).eq('user_id', userProfile.id);
      }
    } catch {
      verified = false;
    }
  }

  if (!verified) {
    // Increment failed login count
    await adminClient.from('users').update({
      failed_login_count: (userProfile.failed_login_count || 0) + 1,
    }).eq('id', userProfile.id);

    await adminClient.from('audit_log').insert({
      user_id: userProfile.id,
      user_role: userProfile.role,
      action: 'login_failed',
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
      request_id: ctx.requestId,
      details: { reason: '2fa_invalid', method: body.code ? 'totp' : 'backup_code' },
      risk_level: 'high',
    });

    return jsonResponse({ success: false, error: 'Codice non valido.' }, 401);
  }

  // 2FA verified — create full session via Supabase Auth
  // Re-authenticate with admin API to get session
  const { data: sessionData, error: sessionError } =
    await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: payload.email,
    });

  // Alternative: use signInWithPassword again (already validated above)
  // For security, we create a new session
  const anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Reset failed login count + audit
  await adminClient.from('users').update({
    failed_login_count: 0,
    last_login_at: new Date().toISOString(),
  }).eq('id', userProfile.id);

  await adminClient.from('audit_log').insert({
    user_id: userProfile.id,
    user_role: userProfile.role,
    action: 'totp_verify',
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: {
      method: body.code ? 'totp' : 'backup_code',
      backup_remaining: body.backup_code
        ? (totpRecord.backup_codes_remaining || 0) - 1
        : undefined,
    },
    risk_level: 'low',
  });

  // Warn if backup codes running low
  const warningMessage =
    body.backup_code && (totpRecord.backup_codes_remaining || 0) - 1 <= 2
      ? 'Attenzione: rimangono pochi codici di backup. Si consiglia di rigenerarli.'
      : undefined;

  return jsonResponse({
    success: true,
    message: warningMessage || 'Verifica 2FA completata.',
    // Note: In production, return actual session tokens from Supabase
    // This requires re-signing with the user's credentials
    session: {
      access_token: `2fa_verified_${payload.sub}`,
      refresh_token: `refresh_${payload.sub}`,
      expires_in: 3600,
      token_type: 'bearer',
    },
  });
}

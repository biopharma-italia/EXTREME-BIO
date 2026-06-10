/**
 * ============================================================================
 * POST /api/auth/verify-2fa
 * ============================================================================
 * Verifies TOTP code or backup code after login.
 * Requires signed temp_token from login response.
 *
 * @version 2.0.0 — 2026-05-11
 * Fixes: P0-1 unsigned temp_token, P0-2 placeholder session tokens
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_middleware';
import { verifyJwt } from '../../../src/lib/jwt';
import { decryptTotpSecret, bytesToHex } from '../../../src/lib/encryption';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_ANON_KEY: string;
  MASTER_ENCRYPTION_KEY: string;
}

interface TempTokenPayload {
  sub: string;
  scope: string;
  email: string;
  exp: number;
  iat: number;
  [key: string]: unknown;
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

  // Verify HMAC-signed temp token (P0-1 fix: no longer accepts unsigned base64)
  const payload = await verifyJwt<TempTokenPayload>(tempToken, env.SUPABASE_SERVICE_KEY);

  if (!payload) {
    return jsonResponse({ success: false, error: 'Token non valido o scaduto.' }, 401);
  }

  if (payload.scope !== '2fa_pending') {
    return jsonResponse({ success: false, error: 'Token non valido per verifica 2FA.' }, 401);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get user profile and TOTP secret
  const { data: userProfile } = await adminClient
    .from('users')
    .select('id, role, email, failed_login_count')
    .eq('auth_id', payload.sub)
    .single();

  if (!userProfile) {
    return jsonResponse({ success: false, error: 'Utente non trovato.' }, 401);
  }

  const { data: totpRecord } = await adminClient
    .from('totp_secrets')
    .select('encrypted_secret, backup_codes_hashes, backup_codes_remaining')
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
    // P1-2 fix: verify backup code against hashes
    try {
      const storedHashes: string[] = JSON.parse(totpRecord.backup_codes_hashes || '[]');
      const inputHash = await hashBackupCode(body.backup_code);
      const codeIndex = storedHashes.findIndex((h: string) => h === inputHash);

      if (codeIndex >= 0) {
        verified = true;
        // Remove used backup code hash
        storedHashes.splice(codeIndex, 1);
        await adminClient.from('totp_secrets').update({
          backup_codes_hashes: JSON.stringify(storedHashes),
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

  // ── 2FA verified — create REAL session (P0-2 fix) ─────────────────────
  // Generate a magic link and immediately verify it to create a real Supabase session
  let accessToken: string;
  let refreshToken: string;
  let expiresIn: number;

  try {
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: payload.email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      throw new Error(linkError?.message || 'Failed to generate magic link');
    }

    // Verify the magic link token to get a real session
    const anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: sessionData, error: sessionError } = await anonClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (sessionError || !sessionData.session) {
      throw new Error(sessionError?.message || 'Failed to create session');
    }

    accessToken = sessionData.session.access_token;
    refreshToken = sessionData.session.refresh_token;
    expiresIn = sessionData.session.expires_in || 3600;
  } catch (err) {
    console.error('[2FA] Session creation error:', err);
    return jsonResponse({
      success: false,
      error: 'Errore nella creazione della sessione. Riprovare il login.',
    }, 500);
  }

  // Reset failed login count + update tracking
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
    session: {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      token_type: 'bearer',
    },
  });
}

// ── Helper: hash backup code with SHA-256 ───────────────────────────────────

async function hashBackupCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code.trim().toUpperCase());
  const hash = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(hash));
}

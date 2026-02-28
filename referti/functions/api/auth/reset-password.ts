/**
 * ============================================================================
 * POST /api/auth/reset-password
 * ============================================================================
 * Resets password using token_hash from email link.
 * 
 * Flow:
 *   1. Client sends { token_hash, password }
 *   2. Server verifies the OTP token via Supabase (anon client)
 *   3. On success, updates password via admin client
 *   4. Revokes sessions, resets lockout, audit log
 *   5. Returns success/error
 * 
 * @version 2.0.0 — 2026-02-28
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_middleware';
import { validatePassword } from '../../../src/lib/validators';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  let body: { token_hash?: string; token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  // Accept both 'token_hash' and 'token' for backwards compatibility
  const tokenHash = body.token_hash || body.token;

  if (!tokenHash) {
    return jsonResponse({ success: false, error: 'Token di reset mancante.' }, 400);
  }

  if (!body.password) {
    return jsonResponse({ success: false, error: 'Nuova password obbligatoria.' }, 400);
  }

  const passwordResult = validatePassword(body.password);
  if (!passwordResult.valid) {
    return jsonResponse({
      success: false,
      error: 'validation_error',
      details: passwordResult.errors,
    }, 400);
  }

  try {
    // ── Step 1: Verify the OTP token ─────────────────────────────────
    // Use anon client — verifyOtp is a public endpoint
    const anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: verifyData, error: verifyError } = await anonClient.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });

    if (verifyError || !verifyData?.user) {
      console.log('[ResetPassword] verifyOtp failed:', verifyError?.message);
      
      // Distinguish between expired and invalid tokens
      const msg = verifyError?.message || '';
      if (msg.includes('expired') || msg.includes('Token has expired')) {
        return jsonResponse({
          success: false,
          error: 'Il link è scaduto. Richiedi un nuovo link dalla pagina di login.',
          code: 'TOKEN_EXPIRED',
        }, 400);
      }
      
      return jsonResponse({
        success: false,
        error: 'Token non valido o scaduto. Richiedi un nuovo link dalla pagina di login.',
        code: 'TOKEN_INVALID',
      }, 400);
    }

    const userId = verifyData.user.id;
    const userEmail = verifyData.user.email;

    // ── Step 2: Update password via admin client ─────────────────────
    // Using admin client avoids session management issues
    const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: body.password,
    });

    if (updateError) {
      console.error('[ResetPassword] updateUserById failed:', updateError.message);
      return jsonResponse({
        success: false,
        error: 'Errore durante il cambio password. Riprova.',
      }, 500);
    }

    // ── Step 3: Cleanup — revoke sessions, reset lockout, audit ──────
    try {
      const { data: userProfile } = await adminClient
        .from('users')
        .select('id, role')
        .eq('auth_id', userId)
        .maybeSingle();

      if (userProfile) {
        // Revoke all sessions
        try {
          await adminClient
            .from('user_sessions')
            .update({ is_revoked: true, revoked_reason: 'password_reset' })
            .eq('user_id', userProfile.id);
        } catch { /* non-blocking */ }

        // Reset lockout
        try {
          await adminClient.from('users').update({
            failed_login_count: 0,
            locked_until: null,
          }).eq('id', userProfile.id);
        } catch { /* non-blocking */ }

        // Audit log
        try {
          await adminClient.from('audit_log').insert({
            user_id: userProfile.id,
            user_role: userProfile.role,
            action: 'password_reset_complete',
            ip_address: ctx.ip,
            user_agent: ctx.userAgent,
            request_id: ctx.requestId,
            details: { email: userEmail },
            risk_level: 'medium',
          });
        } catch { /* non-blocking */ }
      }
    } catch (cleanupErr) {
      // Cleanup errors must not prevent success response
      console.error('[ResetPassword] Cleanup error (non-blocking):', cleanupErr);
    }

    return jsonResponse({
      success: true,
      message: 'Password aggiornata con successo.',
    });
  } catch (err) {
    console.error('[ResetPassword] Error:', err);
    return jsonResponse({
      success: false,
      error: 'Errore durante il reset della password.',
    }, 500);
  }
}

/**
 * ============================================================================
 * POST /api/auth/login
 * ============================================================================
 * Authenticates user with email + password.
 * If 2FA enabled, returns temp_token requiring TOTP verification.
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_middleware';
import { signJwt } from '../../../src/lib/jwt';
import type { RequestContext, LoginResponse } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_ANON_KEY: string;
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  // Parse body
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  const { email, password } = body;
  if (!email || !password) {
    return jsonResponse({ success: false, error: 'Email e password sono obbligatori.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if account is locked
  const { data: userProfile } = await adminClient
    .from('users')
    .select('id, role, failed_login_count, locked_until, is_active, totp_enabled')
    .eq('email', email.toLowerCase().trim())
    .single();

  if (userProfile && !userProfile.is_active) {
    return jsonResponse({ success: false, error: 'Account disattivato.' }, 401);
  }

  if (userProfile?.locked_until && new Date(userProfile.locked_until) > new Date()) {
    return jsonResponse({
      success: false,
      error: 'account_locked',
      message: 'Account temporaneamente bloccato per troppi tentativi.',
      locked_until: userProfile.locked_until,
    }, 423);
  }

  // Attempt login via Supabase Auth
  const anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  });

  if (authError || !authData.session) {
    // Increment failed login count
    if (userProfile) {
      const newCount = (userProfile.failed_login_count || 0) + 1;
      const lockUpdate: Record<string, unknown> = { failed_login_count: newCount };

      // Lock policy: 5 → 15min, 10 → 1h, 20 → disable
      if (newCount >= 20) {
        lockUpdate.is_active = false;
      } else if (newCount >= 10) {
        lockUpdate.locked_until = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      } else if (newCount >= 5) {
        lockUpdate.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }

      await adminClient.from('users').update(lockUpdate).eq('id', userProfile.id);

      // Audit failed login
      await adminClient.from('audit_log').insert({
        user_id: userProfile.id,
        user_role: userProfile.role,
        action: 'login_failed',
        ip_address: ctx.ip,
        user_agent: ctx.userAgent,
        request_id: ctx.requestId,
        details: { attempt: newCount, email },
        risk_level: newCount >= 5 ? 'high' : 'medium',
      });
    }

    return jsonResponse({ success: false, error: 'Credenziali non valide.' }, 401);
  }

  // Login successful — reset failed count
  if (userProfile) {
    await adminClient.from('users').update({
      failed_login_count: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
      login_count: (userProfile as { login_count?: number }).login_count
        ? ((userProfile as { login_count?: number }).login_count || 0) + 1
        : 1,
    }).eq('id', userProfile.id);
  }

  // Check if 2FA is required
  if (userProfile?.totp_enabled) {
    // Don't return full session yet — require 2FA
    // Sign out the Supabase session (we'll re-create after 2FA)
    await anonClient.auth.signOut();

    // Create a short-lived HMAC-signed temp token
    const tempPayload = {
      sub: authData.user.id,
      scope: '2fa_pending',
      email: authData.user.email,
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      iat: Math.floor(Date.now() / 1000),
    };

    // Sign with HMAC-SHA256 using service key to prevent forgery
    const tempToken = await signJwt(tempPayload, env.SUPABASE_SERVICE_KEY);

    const response: LoginResponse = {
      success: true,
      requires_2fa: true,
      temp_token: tempToken,
      message: "Inserisci il codice dall'app di autenticazione.",
    };

    return jsonResponse(response);
  }

  // No 2FA — return full session
  // Audit successful login
  await adminClient.from('audit_log').insert({
    user_id: userProfile?.id,
    user_role: userProfile?.role,
    action: 'login',
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: { email, method: 'password' },
    risk_level: 'low',
  });

  const response: LoginResponse = {
    success: true,
    session: {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      expires_in: authData.session.expires_in || 3600,
      token_type: 'bearer',
    },
    user: {
      id: userProfile?.id || '',
      email: authData.user.email || '',
      first_name: '',
      last_name: '',
      fiscal_code: null,
      phone: null,
      date_of_birth: null,
      gender: null,
      role: (userProfile?.role as 'patient') || 'patient',
      totp_enabled: false,
      preferred_notification_channel: 'email',
      is_email_verified: !!authData.user.email_confirmed_at,
      is_phone_verified: false,
      created_at: authData.user.created_at || '',
      last_login_at: new Date().toISOString(),
    },
  };

  return jsonResponse(response);
}

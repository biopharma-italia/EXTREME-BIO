/**
 * ============================================================================
 * POST /api/auth/forgot-password
 * ============================================================================
 * Generates a password-reset link via Supabase Admin API (no email sent by
 * Supabase) and sends a branded email through Resend.
 * Always returns 200 to prevent email enumeration.
 * 
 * @version 3.0.1 — 2026-02-28
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_middleware';
import { validateEmail, sanitizeInput } from '../../../src/lib/validators';
import { passwordResetEmail } from '../../../src/lib/email-templates';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  RESEND_API_KEY: string;
  APP_URL: string;
  EMAIL_FROM: string;
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  const email = body.email?.toLowerCase().trim();

  if (!email || !validateEmail(email)) {
    return jsonResponse({ success: false, error: 'Email non valida.' }, 400);
  }

  // Always return 200 to prevent email enumeration
  const genericResponse = {
    success: true,
    message: "Se l'email è registrata, riceverai un link per reimpostare la password.",
  };

  try {
    const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check profile (for audit + personalized name, NOT a requirement for reset)
    const { data: userProfile } = await adminClient
      .from('users')
      .select('id, role, first_name')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle();

    // Audit log — MUST use try/catch (not .catch()) to avoid breaking the flow
    try {
      await adminClient.from('audit_log').insert({
        user_id: userProfile?.id || null,
        user_role: userProfile?.role || null,
        action: 'password_reset_request',
        ip_address: ctx.ip,
        user_agent: ctx.userAgent,
        request_id: ctx.requestId,
        details: { email, user_exists_in_profiles: !!userProfile },
        risk_level: 'medium',
      });
    } catch {
      // Audit log failure must not prevent password reset
    }

    // ── Generate reset link via Supabase Admin API ──────────────────────
    // generateLink works against auth.users — if the email doesn't exist
    // there, it returns an error and we return the generic response.
    const appUrl = env.APP_URL || 'https://referti.bio-clinic.it';
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${appUrl}/reset-password`,
      },
    });

    if (linkError || !linkData) {
      console.log('[ForgotPassword] generateLink:', linkError?.message || 'no data');
      return jsonResponse(genericResponse);
    }

    const tokenHash = linkData.properties?.hashed_token;
    if (!tokenHash) {
      console.error('[ForgotPassword] No hashed_token');
      return jsonResponse(genericResponse);
    }

    // Build reset URL
    const resetUrl = `${appUrl}/reset-password?token_hash=${encodeURIComponent(tokenHash)}&type=recovery`;

    // ── Send branded email via Resend ──────────────────────────────────
    const resendKey = env.RESEND_API_KEY;
    if (!resendKey) {
      console.error('[ForgotPassword] RESEND_API_KEY not configured');
      return jsonResponse(genericResponse);
    }

    const emailFrom = env.EMAIL_FROM || 'Bio-Clinic Referti <referti@bio-clinic.it>';
    const firstName = sanitizeInput(userProfile?.first_name || '', 100) || 'Utente';

    const emailHtml = passwordResetEmail(firstName, resetUrl);

    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: emailFrom,
        to: email,
        subject: 'Reimposta la tua password \u2014 Bio-Clinic Referti',
        html: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      const errBody = await emailRes.text();
      console.error('[ForgotPassword] Resend error:', emailRes.status, errBody);
    } else {
      console.log('[ForgotPassword] Email sent via Resend to', email);
    }
  } catch (err) {
    console.error('[ForgotPassword] Error:', err);
  }

  return jsonResponse(genericResponse);
}

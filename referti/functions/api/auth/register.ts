/**
 * ============================================================================
 * POST /api/auth/register
 * ============================================================================
 * Patient self-registration.
 * Creates Supabase Auth user + application user profile + GDPR consents.
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_middleware';
import {
  validateEmail,
  validatePassword,
  validateFiscalCode,
  normalizeMobilePhone,
  sanitizeInput,
} from '../../../src/lib/validators';
import { welcomeEmail } from '../../../src/lib/email-templates';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_ANON_KEY: string;
  RESEND_API_KEY: string;
  APP_URL: string;
  EMAIL_FROM: string;
}

interface RegisterBody {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  fiscal_code?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  consents: {
    privacy_policy: boolean;
    health_data_processing: boolean;
    electronic_delivery: boolean;
    email_notifications?: boolean;
    sms_notifications?: boolean;
    marketing?: boolean;
  };
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  // Parse body
  let body: RegisterBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  // ── Validation ─────────────────────────────────────────────────────────

  const errors: string[] = [];

  if (!body.email || !validateEmail(body.email)) {
    errors.push('Email non valida.');
  }

  const passwordResult = validatePassword(body.password || '');
  if (!passwordResult.valid) {
    errors.push(...passwordResult.errors);
  }

  if (!body.first_name || body.first_name.trim().length < 2) {
    errors.push('Nome obbligatorio (minimo 2 caratteri).');
  }

  if (!body.last_name || body.last_name.trim().length < 2) {
    errors.push('Cognome obbligatorio (minimo 2 caratteri).');
  }

  if (body.fiscal_code && !validateFiscalCode(body.fiscal_code)) {
    errors.push('Codice fiscale non valido.');
  }

  // Phone is MANDATORY for patient self-registration (WhatsApp notifications)
  let normalizedPhone: string | null = null;
  if (!body.phone || !body.phone.trim()) {
    errors.push('Numero di cellulare obbligatorio (per le notifiche di disponibilità referto).');
  } else {
    normalizedPhone = normalizeMobilePhone(body.phone);
    if (!normalizedPhone) {
      errors.push('Numero di cellulare non valido. Inserire un numero mobile (es. 347 1234567).');
    }
  }

  if (body.gender && !['M', 'F', 'X'].includes(body.gender)) {
    errors.push('Genere non valido (M, F, X).');
  }

  // Mandatory consents
  if (!body.consents?.privacy_policy) {
    errors.push("È necessario accettare l'informativa sulla privacy.");
  }
  if (!body.consents?.health_data_processing) {
    errors.push('È necessario acconsentire al trattamento dei dati sanitari.');
  }
  if (!body.consents?.electronic_delivery) {
    errors.push('È necessario acconsentire alla consegna elettronica dei referti.');
  }

  if (errors.length > 0) {
    return jsonResponse({ success: false, error: 'validation_error', details: errors }, 400);
  }

  // ── Create Supabase Auth user ──────────────────────────────────────────

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if email already registered
  const { data: existingUser } = await adminClient
    .from('users')
    .select('id')
    .eq('email', body.email.toLowerCase().trim())
    .maybeSingle();

  if (existingUser) {
    return jsonResponse({ success: false, error: 'user_exists', message: 'Email già registrata.' }, 409);
  }

  // Check if fiscal code already registered
  if (body.fiscal_code) {
    const { data: existingFc } = await adminClient
      .from('users')
      .select('id')
      .eq('fiscal_code', body.fiscal_code.toUpperCase().trim())
      .maybeSingle();

    if (existingFc) {
      return jsonResponse({
        success: false,
        error: 'fiscal_code_exists',
        message: 'Codice fiscale già registrato.',
      }, 409);
    }
  }

  // Create auth user — pass all metadata so the handle_new_user() trigger
  // (migration 006) creates the correct public.users profile automatically.
  const emailNorm = body.email.toLowerCase().trim();
  const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
    email: emailNorm,
    password: body.password,
    email_confirm: false, // User must verify email
    user_metadata: {
      first_name: sanitizeInput(body.first_name, 100),
      last_name: sanitizeInput(body.last_name, 100),
      fiscal_code: body.fiscal_code ? body.fiscal_code.toUpperCase().trim() : null,
      role: 'patient',
    },
  });

  if (authError || !authUser.user) {
    console.error('[Register] Auth error:', authError?.message);
    return jsonResponse({
      success: false,
      error: 'registration_failed',
      message: 'Errore durante la registrazione. Riprovare.',
    }, 500);
  }

  // ── Ensure application user profile is complete ────────────────────────
  // The handle_new_user() trigger already inserted a row into public.users.
  // We use UPSERT to handle both: trigger already fired (update) or not yet (insert).

  const profileData = {
    auth_id: authUser.user.id,
    email: emailNorm,
    phone: normalizedPhone, // already E.164-normalized (same logic as WhatsApp send)
    fiscal_code: body.fiscal_code ? body.fiscal_code.toUpperCase().trim() : null,
    first_name: sanitizeInput(body.first_name, 100),
    last_name: sanitizeInput(body.last_name, 100),
    date_of_birth: body.date_of_birth || null,
    gender: body.gender || null,
    role: 'patient' as const,
    is_active: true,
    is_email_verified: false,
    language: 'it',
    timezone: 'Europe/Rome',
  };

  console.log('[Register] Upserting profile for auth_id:', authUser.user.id);

  const { data: userProfile, error: profileError } = await adminClient
    .from('users')
    .upsert(profileData, { onConflict: 'auth_id' })
    .select('id')
    .single();

  if (profileError) {
    console.error('[Register] Profile upsert failed, retrying:', profileError.message);
    // Retry once after a short delay
    await new Promise(r => setTimeout(r, 500));
    const { data: retryProfile, error: retryError } = await adminClient
      .from('users')
      .upsert(profileData, { onConflict: 'auth_id' })
      .select('id')
      .single();

    if (retryError) {
      await adminClient.auth.admin.deleteUser(authUser.user.id);
      console.error('[Register] Profile retry also failed:', retryError.message);
      return jsonResponse({
        success: false,
        error: 'registration_failed',
        message: 'Errore durante la registrazione. Riprovare.',
      }, 500);
    }

    var retryProfileId = retryProfile.id;
  }

  const registeredUserId = profileError ? retryProfileId! : userProfile!.id;

  // ── Record GDPR consents ───────────────────────────────────────────────

  const consentRecords = Object.entries(body.consents)
    .filter(([, value]) => value === true || value === false)
    .map(([type, given]) => ({
      user_id: registeredUserId,
      consent_type: type,
      version: '1.0',
      given,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
    }));

  if (consentRecords.length > 0) {
    await adminClient.from('gdpr_consents').insert(consentRecords);
  }

  // ── Audit log ──────────────────────────────────────────────────────────

  await adminClient.from('audit_log').insert({
    user_id: registeredUserId,
    user_role: 'patient',
    action: 'user_create',
    target_type: 'user',
    target_id: registeredUserId,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: {
      email: body.email,
      fiscal_code: body.fiscal_code ? '***' : null,
      method: 'self_registration',
    },
    risk_level: 'low',
  });

  // ── Send verification email (handled by Supabase Auth automatically) ──
  // Also send welcome email via Resend for better deliverability
  console.log('[Register] Email check — RESEND_API_KEY:', env.RESEND_API_KEY ? `set (${env.RESEND_API_KEY.substring(0, 6)}...)` : 'NOT SET');
  if (env.RESEND_API_KEY) {
    try {
      const appUrl = env.APP_URL || 'https://referti.bio-clinic.it';
      const emailFrom = env.EMAIL_FROM || 'Bio-Clinic Referti <referti@bio-clinic.it>';

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: emailFrom,
          to: body.email.toLowerCase().trim(),
          subject: 'Benvenuto su Bio-Clinic Referti Online',
          html: welcomeEmail(sanitizeInput(body.first_name, 100), body.email.toLowerCase().trim(), appUrl),
        }),
      });
    } catch (err) {
      console.error('[Register] Welcome email error:', err);
    }
  } else {
    console.warn('[Register] RESEND_API_KEY not configured — skipping welcome email for', body.email);
  }

  return jsonResponse({
    success: true,
    user_id: registeredUserId,
    message: "Registrazione completata. Controlla la tua email per verificare l'account.",
  }, 201);
}

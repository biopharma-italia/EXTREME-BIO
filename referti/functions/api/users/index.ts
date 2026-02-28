/**
 * ============================================================================
 * /api/users — GET (list, admin) + POST (create staff/patient, admin)
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../_middleware';
import { sanitizeInput, validateEmail, validateFiscalCode, validatePhone } from '../../../src/lib/validators';
import type { RequestContext, UserRole } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RESEND_API_KEY: string;
  APP_URL: string;
  EMAIL_FROM: string;
}

// ── GET /api/users (admin only) ──────────────────────────────────────────────

export async function onRequestGet(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  const authError = requireRole(ctx, 'admin', 'super_admin', 'ostetrica');
  if (authError) return authError;

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') || '50')));
  const offset = (page - 1) * perPage;

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let query = adminClient
    .from('users')
    .select('id, email, first_name, last_name, fiscal_code, phone, role, is_active, totp_enabled, created_at, last_login_at', { count: 'exact' })
    .is('deleted_at', null);

  // Ostetrica can only see patients
  if (ctx.user!.role === 'ostetrica') {
    query = query.eq('role', 'patient');
  }

  const role = url.searchParams.get('role');
  if (role) query = query.eq('role', role);

  const active = url.searchParams.get('active');
  if (active === 'true') query = query.eq('is_active', true);
  if (active === 'false') query = query.eq('is_active', false);

  const search = url.searchParams.get('search');
  if (search) {
    const s = sanitizeInput(search, 100);
    query = query.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,fiscal_code.ilike.%${s}%`);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + perPage - 1);

  const { data: users, error, count } = await query;

  if (error) {
    console.error('[Users] List error:', error.message);
    return jsonResponse({ success: false, error: 'Errore nel caricamento degli utenti.' }, 500);
  }

  return jsonResponse({
    success: true,
    data: users,
    pagination: { page, per_page: perPage, total: count || 0, total_pages: Math.ceil((count || 0) / perPage) },
  });
}

// ── POST /api/users (create staff or patient) ──────────────────────────────
// Allowed callers: admin, super_admin (any role), ostetrica (patient only)

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  // Ostetrica can create patients; admin/super_admin can create any role
  const authError = requireRole(ctx, 'admin', 'super_admin', 'ostetrica');
  if (authError) return authError;

  let body: {
    email?: string; first_name?: string; last_name?: string;
    role?: UserRole; password?: string; send_invite?: boolean;
    fiscal_code?: string; phone?: string; date_of_birth?: string; gender?: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  // ── Validation ──────────────────────────────────────────────────────────
  if (!body.email || !validateEmail(body.email)) {
    return jsonResponse({ success: false, error: 'Email non valida.' }, 400);
  }
  if (!body.first_name || !body.last_name) {
    return jsonResponse({ success: false, error: 'Nome e cognome obbligatori.' }, 400);
  }

  const validRoles: UserRole[] = ['patient', 'lab_technician', 'physician', 'admin', 'ostetrica'];
  if (!body.role || !validRoles.includes(body.role)) {
    return jsonResponse({ success: false, error: 'Ruolo non valido.' }, 400);
  }

  // Only super_admin can create admin users
  if (body.role === 'admin' && ctx.user!.role !== 'super_admin') {
    return jsonResponse({ success: false, error: 'Solo il super admin può creare utenti admin.' }, 403);
  }

  // Ostetrica can only create patients
  if (ctx.user!.role === 'ostetrica' && body.role !== 'patient') {
    return jsonResponse({ success: false, error: 'L\'ostetrica può creare solo pazienti.' }, 403);
  }

  const isPatient = body.role === 'patient';

  // Patient-specific validation
  if (isPatient) {
    if (!body.fiscal_code) {
      return jsonResponse({ success: false, error: 'Codice fiscale obbligatorio per i pazienti.' }, 400);
    }
    if (!validateFiscalCode(body.fiscal_code)) {
      return jsonResponse({ success: false, error: 'Formato codice fiscale non valido.' }, 400);
    }
    if (!body.password || body.password.length < 12) {
      return jsonResponse({ success: false, error: 'Password obbligatoria (minimo 12 caratteri).' }, 400);
    }
  }

  // Optional field validation
  if (body.fiscal_code && !validateFiscalCode(body.fiscal_code)) {
    return jsonResponse({ success: false, error: 'Formato codice fiscale non valido.' }, 400);
  }
  if (body.phone && !validatePhone(body.phone)) {
    return jsonResponse({ success: false, error: 'Numero di telefono non valido.' }, 400);
  }
  if (body.gender && !['M', 'F', 'X'].includes(body.gender)) {
    return jsonResponse({ success: false, error: 'Genere non valido (M, F, X).' }, 400);
  }

  const emailNorm = body.email.toLowerCase().trim();
  const fiscalNorm = body.fiscal_code ? body.fiscal_code.toUpperCase().trim() : null;

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Check for duplicates ────────────────────────────────────────────────
  const { data: existingEmail } = await adminClient
    .from('users')
    .select('id')
    .eq('email', emailNorm)
    .is('deleted_at', null)
    .maybeSingle();

  if (existingEmail) {
    return jsonResponse({ success: false, error: 'Email già registrata.' }, 409);
  }

  if (fiscalNorm) {
    const { data: existingFc } = await adminClient
      .from('users')
      .select('id')
      .eq('fiscal_code', fiscalNorm)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingFc) {
      return jsonResponse({ success: false, error: 'Codice fiscale già registrato.' }, 409);
    }
  }

  // ── Create auth user ────────────────────────────────────────────────────
  // All users (patients + staff) are created with createUser + temp password.
  // They receive an email with credentials and can login immediately.
  const metadata = {
    first_name: body.first_name,
    last_name: body.last_name,
    role: body.role,
    ...(fiscalNorm ? { fiscal_code: fiscalNorm } : {}),
  };

  // Password validation: required for patients, auto-generated for staff if missing
  let userPassword = body.password || '';
  if (!userPassword || userPassword.length < 12) {
    if (isPatient) {
      return jsonResponse({ success: false, error: 'Password obbligatoria (minimo 12 caratteri).' }, 400);
    }
    // Auto-generate a strong 16-char password for staff if not provided
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    userPassword = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => chars[b % chars.length]).join('');
  }

  let authUserId: string;

  const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
    email: emailNorm,
    password: userPassword,
    email_confirm: true, // Admin-created users are pre-verified
    user_metadata: metadata,
  });

  if (authErr || !authUser.user) {
    console.error('[Users] Create auth error:', authErr?.message);
    return jsonResponse({ success: false, error: authErr?.message || 'Errore nella creazione dell\'utente.' }, 500);
  }
  authUserId = authUser.user.id;

  // ── Upsert profile ──────────────────────────────────────────────────────
  // The handle_new_user() trigger (migration 006) auto-creates a public.users
  // row when auth.users gets a new row. We use UPSERT to handle both cases:
  // - trigger already fired → updates the existing row
  // - trigger not yet fired → inserts the row
  const profileFields: Record<string, unknown> = {
    auth_id: authUserId,
    email: emailNorm,
    first_name: sanitizeInput(body.first_name, 100),
    last_name: sanitizeInput(body.last_name, 100),
    role: body.role,
    is_active: true,
    is_email_verified: isPatient, // Admin-created patients are pre-verified
    language: 'it',
    timezone: 'Europe/Rome',
  };
  if (fiscalNorm) profileFields.fiscal_code = fiscalNorm;
  if (body.phone) profileFields.phone = sanitizeInput(body.phone, 20);
  if (body.date_of_birth) profileFields.date_of_birth = body.date_of_birth;
  if (body.gender) profileFields.gender = body.gender;

  console.log('[Users] Upserting profile for auth_id:', authUserId);

  // Try upsert — ON CONFLICT (auth_id) DO UPDATE
  const { data: userProfile, error: profileError } = await adminClient
    .from('users')
    .upsert(profileFields, { onConflict: 'auth_id' })
    .select('id')
    .single();

  if (profileError) {
    console.error('[Users] Profile upsert failed:', profileError.message, profileError.code);
    // Retry once after a short delay (trigger may be in-flight)
    await new Promise(r => setTimeout(r, 500));
    const { data: retryProfile, error: retryError } = await adminClient
      .from('users')
      .upsert(profileFields, { onConflict: 'auth_id' })
      .select('id')
      .single();

    if (retryError) {
      console.error('[Users] Profile retry also failed:', retryError.message);
      await adminClient.auth.admin.deleteUser(authUserId);
      return jsonResponse({ success: false, error: 'Errore nella creazione del profilo.' }, 500);
    }

    var retryId = retryProfile.id;
  }

  const userId = profileError ? retryId! : userProfile!.id;

  // ── Audit log ───────────────────────────────────────────────────────────
  await adminClient.from('audit_log').insert({
    user_id: ctx.user!.id,
    user_role: ctx.user!.role,
    action: 'user_create',
    target_type: 'user',
    target_id: userId,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: {
      email: body.email,
      role: body.role,
      method: isPatient ? 'admin_create_patient' : 'admin_invite',
      fiscal_code: fiscalNorm ? '***' : null,
    },
    risk_level: 'medium',
  });

  // ── Send email via Resend ───────────────────────────────────────────────
  console.log('[Users] Email check — RESEND_API_KEY:', env.RESEND_API_KEY ? `set (${env.RESEND_API_KEY.substring(0, 6)}...)` : 'NOT SET');
  if (env.RESEND_API_KEY && body.email) {
    try {
      const appUrl = env.APP_URL || 'https://referti.bio-clinic.it';
      const emailFrom = env.EMAIL_FROM || 'Bio-Clinic Referti <referti@bio-clinic.it>';
      const roleLabels: Record<string, string> = {
        lab_technician: 'Tecnico Laboratorio',
        physician: 'Medico',
        admin: 'Amministratore',
        ostetrica: 'Ostetrica',
        patient: 'Paziente',
      };
      const roleLabel = roleLabels[body.role || ''] || body.role || 'Staff';

      let emailSubject: string;
      let emailHtml: string;

      if (isPatient) {
        // Patient email: include credentials
        emailSubject = 'I suoi referti online — Bio-Clinic Sassari';
        emailHtml = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f7f9fc;padding:20px">
  <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <div style="text-align:center;margin-bottom:24px">
      <div style="background:#00704A;color:white;display:inline-block;padding:8px 20px;border-radius:8px;font-size:18px;font-weight:600">
        Bio-Clinic Sassari
      </div>
    </div>
    <h2 style="color:#1a1a2e;margin:0 0 16px">Gentile ${sanitizeInput(body.first_name || '', 100)},</h2>
    <p style="color:#444;line-height:1.6">
      \u00c8 stato creato il suo account per il portale <strong>Referti Online</strong> di Bio-Clinic Sassari.
      Da questo portale potr\u00e0 consultare e scaricare i suoi referti in modo sicuro e riservato.
    </p>
    <div style="background:#f0faf5;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #00704A">
      <p style="margin:0 0 8px;color:#333;font-size:15px;font-weight:600">Le sue credenziali di accesso:</p>
      <table style="width:100%;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:4px 0;color:#555;width:90px"><strong>Email:</strong></td><td style="padding:4px 0;color:#333">${emailNorm}</td></tr>
        <tr><td style="padding:4px 0;color:#555"><strong>Password:</strong></td><td style="padding:4px 0;color:#333;font-family:monospace;background:#fff;padding:2px 6px;border-radius:4px">${userPassword}</td></tr>
      </table>
    </div>
    <p style="color:#c0392b;font-size:13px;line-height:1.5">
      <strong>Importante:</strong> Le consigliamo di cambiare la password al primo accesso per garantire la sicurezza del suo account.
    </p>
    <div style="text-align:center;margin:28px 0">
      <a href="${appUrl}/dashboard/"
         style="background:#00704A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px">
        Accedi al Portale Referti
      </a>
    </div>
    <p style="color:#666;font-size:13px;line-height:1.5;margin-top:16px">
      Al primo accesso le verr\u00e0 richiesto di accettare i consensi per il trattamento dei dati e la consegna elettronica dei referti.
    </p>
    <p style="color:#888;font-size:12px;line-height:1.5;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
      Bio-Clinic Sassari \u2014 Via Renzo Mossa 23, 07100 Sassari<br>
      Tel: 079 956 1332 | <a href="mailto:gestione@bio-clinic.it" style="color:#00704A">gestione@bio-clinic.it</a>
    </p>
  </div>
</body>
</html>`;
      } else {
        // Staff email: include credentials + role info
        emailSubject = 'Il suo account Bio-Clinic Referti \u00e8 stato creato';
        emailHtml = `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f7f9fc;padding:20px">
  <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <div style="text-align:center;margin-bottom:24px">
      <div style="background:#00704A;color:white;display:inline-block;padding:8px 20px;border-radius:8px;font-size:18px;font-weight:600">
        Bio-Clinic Sassari
      </div>
    </div>
    <h2 style="color:#1a1a2e;margin:0 0 16px">Benvenuto nel team, ${sanitizeInput(body.first_name || '', 100)}!</h2>
    <p style="color:#444;line-height:1.6">
      Il suo account per il portale Referti Online di Bio-Clinic \u00e8 stato creato dall'amministratore.
    </p>
    <div style="background:#f0faf5;border-radius:8px;padding:16px;margin:20px 0;border-left:4px solid #00704A">
      <p style="margin:0 0 8px;color:#333;font-size:15px;font-weight:600">Le sue credenziali di accesso:</p>
      <table style="width:100%;font-size:14px;border-collapse:collapse">
        <tr><td style="padding:4px 0;color:#555;width:90px"><strong>Ruolo:</strong></td><td style="padding:4px 0;color:#333"><strong>${roleLabel}</strong></td></tr>
        <tr><td style="padding:4px 0;color:#555"><strong>Email:</strong></td><td style="padding:4px 0;color:#333">${emailNorm}</td></tr>
        <tr><td style="padding:4px 0;color:#555"><strong>Password:</strong></td><td style="padding:4px 0;color:#333;font-family:monospace;background:#fff;padding:2px 6px;border-radius:4px">${userPassword}</td></tr>
      </table>
    </div>
    <p style="color:#c0392b;font-size:13px;line-height:1.5">
      <strong>Importante:</strong> Le consigliamo di cambiare la password al primo accesso per garantire la sicurezza del suo account.
    </p>
    <div style="text-align:center;margin:28px 0">
      <a href="${appUrl}/dashboard/"
         style="background:#00704A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px">
        Accedi al Portale
      </a>
    </div>
    <p style="color:#888;font-size:12px;line-height:1.5;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
      Bio-Clinic Sassari \u2014 Via Renzo Mossa 23, 07100 Sassari<br>
      Per assistenza: <a href="mailto:gestione@bio-clinic.it" style="color:#00704A">gestione@bio-clinic.it</a>
    </p>
  </div>
</body>
</html>`;
      }

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: emailFrom,
          to: emailNorm,
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (!emailRes.ok) {
        const errBody = await emailRes.text();
        console.error('[Users] Resend email error:', emailRes.status, errBody);
      } else {
        console.log('[Users] Email sent successfully to', emailNorm);
      }
    } catch (err) {
      console.error('[Users] Welcome email error:', err);
    }
  } else if (!env.RESEND_API_KEY) {
    console.warn('[Users] RESEND_API_KEY not configured — skipping welcome email for', body.email);
  }

  return jsonResponse({
    success: true,
    data: { id: userId, invite_sent: true },
  }, 201);
}

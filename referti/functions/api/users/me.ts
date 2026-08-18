/**
 * ============================================================================
 * /api/users/me — GET (profile) + PATCH (update)
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_middleware';
import { sanitizeInput, normalizeMobilePhone } from '../../../src/lib/validators';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// ── GET /api/users/me ────────────────────────────────────────────────────────

export async function onRequestGet(context: {
  data: { ctx: RequestContext; env: Env };
}) {
  const { data } = context;
  const { ctx, env } = data;

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: profile, error } = await adminClient
    .from('users')
    .select(`
      id, email, first_name, last_name, fiscal_code, phone,
      date_of_birth, gender, role, totp_enabled,
      preferred_notification_channel, is_email_verified, is_phone_verified,
      language, timezone, created_at, last_login_at
    `)
    .eq('id', ctx.user.id)
    .single();

  if (error || !profile) {
    return jsonResponse({ success: false, error: 'Profilo non trovato.' }, 404);
  }

  return jsonResponse({ success: true, data: profile });
}

// ── PATCH /api/users/me ──────────────────────────────────────────────────────

export async function onRequestPatch(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const updateData: Record<string, unknown> = {};

  // Fields patients can update
  const patientAllowed = ['phone', 'preferred_notification_channel', 'language'];
  // Additional fields admins can update
  const adminAllowed = [...patientAllowed, 'first_name', 'last_name', 'date_of_birth', 'gender', 'timezone'];

  const allowedFields = ['admin', 'super_admin'].includes(ctx.user.role)
    ? adminAllowed
    : patientAllowed;

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === 'phone') {
        // Patients cannot remove their phone number (mandatory for WhatsApp)
        if (!body.phone || !(body.phone as string).trim()) {
          if (ctx.user.role === 'patient') {
            return jsonResponse({ success: false, error: 'Il numero di cellulare è obbligatorio e non può essere rimosso.' }, 400);
          }
          updateData.phone = null;
        } else {
          const normalized = normalizeMobilePhone(body.phone as string);
          if (!normalized) {
            return jsonResponse({ success: false, error: 'Numero di cellulare non valido. Inserire un numero mobile (es. 347 1234567).' }, 400);
          }
          updateData.phone = normalized;
        }
      } else if (field === 'preferred_notification_channel') {
        const valid = ['email', 'sms', 'whatsapp', 'push', 'in_app'];
        if (valid.includes(body[field] as string)) {
          updateData[field] = body[field];
        }
      } else if (field === 'language') {
        updateData[field] = sanitizeInput(body[field] as string, 5);
      } else {
        updateData[field] = typeof body[field] === 'string'
          ? sanitizeInput(body[field] as string, 100)
          : body[field];
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return jsonResponse({ success: false, error: 'Nessun campo valido da aggiornare.' }, 400);
  }

  const { error } = await adminClient
    .from('users')
    .update(updateData)
    .eq('id', ctx.user.id);

  if (error) {
    console.error('[Users] Update error:', error.message);
    return jsonResponse({ success: false, error: "Errore nell'aggiornamento." }, 500);
  }

  // Audit log
  await adminClient.from('audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: 'profile_update',
    target_type: 'user',
    target_id: ctx.user.id,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: { updated_fields: Object.keys(updateData) },
    risk_level: 'low',
  });

  return jsonResponse({ success: true, message: 'Profilo aggiornato.' });
}

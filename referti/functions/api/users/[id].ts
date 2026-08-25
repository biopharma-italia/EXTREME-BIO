/**
 * ============================================================================
 * /api/users/[id] — PATCH (update user profile, staff)
 * ============================================================================
 * Perché esiste: il frontend salvava le modifiche utente con PATCH diretto
 * su Supabase REST, ma la RLS users_update_own consente l'UPDATE solo a
 * admin/super_admin (o a se stessi). Per ostetrica/lab_technician il PATCH
 * era un no-op silenzioso (200, 0 righe). Questo endpoint usa il service key
 * con controlli di ruolo espliciti + validazione + audit log.
 *
 * Regole:
 *  - admin, super_admin: possono modificare chiunque (ma solo super_admin
 *    può toccare utenti admin/super_admin o assegnare il ruolo admin)
 *  - ostetrica, lab_technician: possono modificare SOLO pazienti e non
 *    possono cambiare il ruolo
 *  - se cambia l'email viene aggiornata anche su Supabase Auth (login)
 *
 * @version 1.0.0 — 2026-08-25
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../_middleware';
import {
  sanitizeInput, validateEmail, validateFiscalCode, validatePhone,
  normalizeMobilePhone, validateUuid, validateDate,
} from '../../../src/lib/validators';
import type { RequestContext, UserRole } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface UpdateBody {
  first_name?: string;
  last_name?: string;
  email?: string;
  fiscal_code?: string | null;
  date_of_birth?: string | null;
  phone?: string | null;
  gender?: string | null;
  role?: UserRole;
  is_active?: boolean;
}

export async function onRequestPatch(context: {
  request: Request;
  params: { id: string };
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, params, data } = context;
  const { ctx, env } = data;

  const authError = requireRole(ctx, 'admin', 'super_admin', 'ostetrica', 'lab_technician');
  if (authError) return authError;

  const userId = params.id;
  if (!validateUuid(userId)) {
    return jsonResponse({ success: false, error: 'ID utente non valido.' }, 400);
  }

  let body: UpdateBody;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── Load target user ──────────────────────────────────────────────────────
  const { data: target, error: targetErr } = await adminClient
    .from('users')
    .select('id, auth_id, email, role, is_active')
    .eq('id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (targetErr) {
    console.error('[Users:PATCH] Load target error:', targetErr.message);
    return jsonResponse({ success: false, error: 'Errore nel caricamento dell\'utente.' }, 500);
  }
  if (!target) {
    return jsonResponse({ success: false, error: 'Utente non trovato.' }, 404);
  }

  const callerRole = ctx.user!.role;
  const isLimitedStaff = callerRole === 'ostetrica' || callerRole === 'lab_technician';

  // ── Permission checks ─────────────────────────────────────────────────────
  // Limited staff can only edit patients
  if (isLimitedStaff && target.role !== 'patient') {
    return jsonResponse({ success: false, error: 'Permessi insufficienti: puoi modificare solo i pazienti.' }, 403);
  }
  // Limited staff cannot change role
  if (isLimitedStaff && body.role !== undefined && body.role !== target.role) {
    return jsonResponse({ success: false, error: 'Permessi insufficienti: non puoi modificare il ruolo.' }, 403);
  }
  // Only super_admin can edit admin/super_admin users
  if ((target.role === 'admin' || target.role === 'super_admin') && callerRole !== 'super_admin') {
    return jsonResponse({ success: false, error: 'Solo il super admin può modificare utenti amministratori.' }, 403);
  }
  // Only super_admin can assign admin/super_admin role
  if (body.role !== undefined && ['admin', 'super_admin'].includes(body.role) &&
      body.role !== target.role && callerRole !== 'super_admin') {
    return jsonResponse({ success: false, error: 'Solo il super admin può assegnare il ruolo admin.' }, 403);
  }

  // ── Validation + build update object ──────────────────────────────────────
  const updates: Record<string, unknown> = {};
  const effectiveRole: UserRole = (body.role !== undefined ? body.role : target.role) as UserRole;
  const isPatient = effectiveRole === 'patient';

  if (body.first_name !== undefined) {
    const v = sanitizeInput(body.first_name, 100).trim();
    if (!v) return jsonResponse({ success: false, error: 'Il nome non può essere vuoto.' }, 400);
    updates.first_name = v;
  }
  if (body.last_name !== undefined) {
    const v = sanitizeInput(body.last_name, 100).trim();
    if (!v) return jsonResponse({ success: false, error: 'Il cognome non può essere vuoto.' }, 400);
    updates.last_name = v;
  }

  let emailChanged = false;
  if (body.email !== undefined) {
    const emailNorm = (body.email || '').toLowerCase().trim();
    if (!validateEmail(emailNorm)) {
      return jsonResponse({ success: false, error: 'Email non valida.' }, 400);
    }
    if (emailNorm !== (target.email || '').toLowerCase()) {
      // Uniqueness check (exclude self)
      const { data: dupe } = await adminClient
        .from('users')
        .select('id')
        .eq('email', emailNorm)
        .neq('id', userId)
        .is('deleted_at', null)
        .maybeSingle();
      if (dupe) {
        return jsonResponse({ success: false, error: 'Email già registrata da un altro utente.' }, 409);
      }
      updates.email = emailNorm;
      emailChanged = true;
    }
  }

  if (body.fiscal_code !== undefined) {
    if (body.fiscal_code === null || body.fiscal_code === '') {
      if (isPatient) {
        return jsonResponse({ success: false, error: 'Il codice fiscale è obbligatorio per i pazienti.' }, 400);
      }
      updates.fiscal_code = null;
    } else {
      const cf = body.fiscal_code.toUpperCase().trim();
      if (!validateFiscalCode(cf)) {
        return jsonResponse({ success: false, error: 'Formato codice fiscale non valido.' }, 400);
      }
      // Uniqueness check (exclude self)
      const { data: dupeCf } = await adminClient
        .from('users')
        .select('id')
        .eq('fiscal_code', cf)
        .neq('id', userId)
        .is('deleted_at', null)
        .maybeSingle();
      if (dupeCf) {
        return jsonResponse({ success: false, error: 'Codice fiscale già registrato da un altro utente.' }, 409);
      }
      updates.fiscal_code = cf;
    }
  }

  if (body.phone !== undefined) {
    if (body.phone === null || body.phone === '') {
      if (isPatient) {
        return jsonResponse({ success: false, error: 'Il numero di cellulare è obbligatorio per i pazienti (notifiche WhatsApp).' }, 400);
      }
      updates.phone = null;
    } else if (isPatient) {
      // Patients: normalize to E.164 mobile (same logic as WhatsApp send path)
      const normalized = normalizeMobilePhone(body.phone);
      if (!normalized) {
        return jsonResponse({
          success: false,
          error: `Numero di cellulare non valido: "${body.phone}". Inserire un numero mobile (es. 347 1234567). I numeri fissi non ricevono WhatsApp.`,
        }, 400);
      }
      updates.phone = normalized;
    } else {
      if (!validatePhone(body.phone)) {
        return jsonResponse({ success: false, error: 'Numero di telefono non valido.' }, 400);
      }
      updates.phone = sanitizeInput(body.phone, 20);
    }
  }

  if (body.date_of_birth !== undefined) {
    if (body.date_of_birth === null || body.date_of_birth === '') {
      updates.date_of_birth = null;
    } else {
      if (!validateDate(body.date_of_birth)) {
        return jsonResponse({ success: false, error: 'Data di nascita non valida.' }, 400);
      }
      updates.date_of_birth = body.date_of_birth;
    }
  }

  if (body.gender !== undefined) {
    if (body.gender === null || body.gender === '') {
      updates.gender = null;
    } else if (!['M', 'F', 'X'].includes(body.gender)) {
      return jsonResponse({ success: false, error: 'Genere non valido (M, F, X).' }, 400);
    } else {
      updates.gender = body.gender;
    }
  }

  if (body.role !== undefined && body.role !== target.role) {
    const validRoles: UserRole[] = ['patient', 'lab_technician', 'physician', 'admin', 'super_admin', 'ostetrica'];
    if (!validRoles.includes(body.role)) {
      return jsonResponse({ success: false, error: 'Ruolo non valido.' }, 400);
    }
    updates.role = body.role;
  }

  if (body.is_active !== undefined) {
    updates.is_active = !!body.is_active;
  }

  if (Object.keys(updates).length === 0) {
    return jsonResponse({ success: true, data: { id: userId, updated: false }, message: 'Nessuna modifica.' });
  }

  // ── Update Supabase Auth email first (login), then profile ────────────────
  if (emailChanged && target.auth_id) {
    const { error: authErr } = await adminClient.auth.admin.updateUserById(target.auth_id, {
      email: updates.email as string,
      email_confirm: true,
    });
    if (authErr) {
      console.error('[Users:PATCH] Auth email update error:', authErr.message);
      return jsonResponse({ success: false, error: 'Errore nell\'aggiornamento dell\'email di accesso: ' + authErr.message }, 500);
    }
  }

  // ── Update profile row ─────────────────────────────────────────────────────
  const { data: updated, error: updErr } = await adminClient
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select('id, email, first_name, last_name, fiscal_code, phone, role, is_active, date_of_birth, gender')
    .single();

  if (updErr) {
    console.error('[Users:PATCH] Profile update error:', updErr.message);
    // Rollback auth email if profile update failed
    if (emailChanged && target.auth_id) {
      await adminClient.auth.admin.updateUserById(target.auth_id, {
        email: target.email, email_confirm: true,
      }).catch(() => { /* best effort */ });
    }
    return jsonResponse({ success: false, error: 'Errore nel salvataggio delle modifiche.' }, 500);
  }

  // ── Audit log ──────────────────────────────────────────────────────────────
  await adminClient.from('audit_log').insert({
    user_id: ctx.user!.id,
    user_role: ctx.user!.role,
    action: 'user_update',
    target_type: 'user',
    target_id: userId,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: {
      updated_fields: Object.keys(updates),
      email_changed: emailChanged,
      target_role: target.role,
    },
    risk_level: emailChanged || updates.role !== undefined ? 'medium' : 'low',
  });

  return jsonResponse({ success: true, data: updated });
}

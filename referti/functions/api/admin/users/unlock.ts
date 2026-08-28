/**
 * ============================================================================
 * POST /api/admin/users/unlock — Sblocca account + reset password opzionale
 * ============================================================================
 * Per la segreteria: quando un paziente resta bloccato per troppi tentativi
 * di login errati (o non ricorda la password), questo endpoint:
 *   1. Azzera failed_login_count e locked_until
 *   2. Conferma l'email lato Supabase Auth (se mai verificata)
 *   3. [opzionale] Genera una password temporanea e la restituisce
 *   4. Revoca le sessioni attive (solo se reset password)
 *   5. Scrive audit log
 *
 * Body: { user_id: string, reset_password?: boolean }
 *
 * Permessi:
 *   - admin / super_admin: qualsiasi utente (tranne super_admin altrui)
 *   - ostetrica / lab_technician: solo pazienti
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../../_middleware';
import type { RequestContext } from '../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

/** Password temporanea leggibile al telefono: senza caratteri ambigui (0/O, 1/l/I). */
function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const lower = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!#%+';
  const pick = (set: string, n: number) => {
    let out = '';
    const buf = new Uint32Array(n);
    crypto.getRandomValues(buf);
    for (let i = 0; i < n; i++) out += set[buf[i] % set.length];
    return out;
  };
  // Formato: Xxxxx + simbolo + 4 cifre + Xxx (12 char, policy-compliant)
  return (
    pick(upper, 1) + pick(lower, 4) + pick(symbols, 1) + pick(digits, 4) + pick(upper, 1) + pick(lower, 1)
  );
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  const authError = requireRole(ctx, 'lab_technician', 'admin', 'super_admin', 'ostetrica');
  if (authError) return authError;

  let body: { user_id?: string; reset_password?: boolean };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  if (!body.user_id || !/^[0-9a-f-]{36}$/i.test(body.user_id)) {
    return jsonResponse({ success: false, error: 'user_id non valido.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: target } = await adminClient
    .from('users')
    .select('id, auth_id, email, first_name, last_name, role, is_active, failed_login_count, locked_until')
    .eq('id', body.user_id)
    .is('deleted_at', null)
    .single();

  if (!target) {
    return jsonResponse({ success: false, error: 'Utente non trovato.' }, 404);
  }

  // ── Permessi granulari ──────────────────────────────────────────────────
  const callerRole = ctx.user!.role;
  const isAdminCaller = callerRole === 'admin' || callerRole === 'super_admin';
  if (!isAdminCaller && target.role !== 'patient') {
    return jsonResponse({
      success: false,
      error: 'Puoi sbloccare solo account paziente.',
    }, 403);
  }
  if (target.role === 'super_admin' && callerRole !== 'super_admin') {
    return jsonResponse({ success: false, error: 'Operazione non consentita.' }, 403);
  }

  // ── 1. Sblocca: azzera contatore, rimuove lock, riattiva se disattivato
  //      dal lockout automatico (soglia 20 tentativi) ─────────────────────
  const unlockUpdate: Record<string, unknown> = {
    failed_login_count: 0,
    locked_until: null,
  };
  if (!target.is_active && target.role === 'patient') {
    unlockUpdate.is_active = true;
  }
  const { error: unlockError } = await adminClient
    .from('users')
    .update(unlockUpdate)
    .eq('id', target.id);

  if (unlockError) {
    console.error('[Unlock] Update failed:', unlockError.message);
    return jsonResponse({ success: false, error: 'Errore durante lo sblocco.' }, 500);
  }

  // ── 2. Conferma email + 3. reset password (lato Supabase Auth) ─────────
  let tempPassword: string | null = null;
  if (target.auth_id) {
    const authUpdate: Record<string, unknown> = { email_confirm: true };
    if (body.reset_password) {
      tempPassword = generateTempPassword();
      authUpdate.password = tempPassword;
    }
    const { error: authUpdError } = await adminClient.auth.admin.updateUserById(
      target.auth_id,
      authUpdate,
    );
    if (authUpdError) {
      console.error('[Unlock] Auth update failed:', authUpdError.message);
      if (body.reset_password) {
        return jsonResponse({
          success: false,
          error: 'Sblocco riuscito ma reset password fallito. Riprova.',
        }, 500);
      }
    }
  }

  // ── 4. Revoca sessioni attive (solo se password cambiata) ──────────────
  if (tempPassword) {
    try {
      await adminClient
        .from('user_sessions')
        .update({ is_revoked: true, revoked_reason: 'admin_password_reset' })
        .eq('user_id', target.id);
    } catch { /* non-blocking */ }
  }

  // ── 5. Audit log ────────────────────────────────────────────────────────
  try {
    await adminClient.from('audit_log').insert({
      user_id: target.id,
      user_role: target.role,
      action: 'admin_action', // enum audit_action: dettaglio in details.operation
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
      request_id: ctx.requestId,
      details: {
        operation: body.reset_password ? 'admin_unlock_and_reset' : 'admin_unlock',
        email: target.email,
        performed_by: ctx.user!.id,
        performed_by_role: callerRole,
        previous_failed_count: target.failed_login_count,
        was_locked_until: target.locked_until,
        password_reset: !!body.reset_password,
      },
      risk_level: 'medium',
    });
  } catch { /* non-blocking */ }

  return jsonResponse({
    success: true,
    message: body.reset_password
      ? 'Account sbloccato e password reimpostata.'
      : 'Account sbloccato.',
    data: {
      email: target.email,
      name: `${target.first_name} ${target.last_name}`,
      temp_password: tempPassword,
    },
  });
}

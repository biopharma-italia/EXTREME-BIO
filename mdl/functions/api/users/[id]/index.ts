/**
 * GET    /api/users/:id — Get user details
 * PATCH  /api/users/:id — Update user profile
 * DELETE /api/users/:id — Soft-delete (deactivate) user
 */

import {
  canManageUsers,
  canModifyUserRole,
  creatableRolesFor,
  COMPANY_BOUND_ROLES,
} from '../../lib/permissions';

// ═══════════════════════════════════════════════════════════════════════════════
// GET — User detail
// ═══════════════════════════════════════════════════════════════════════════════

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !canManageUsers(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const userId = (context.params as any).id;

  const { data, error } = await supabaseAdmin
    .from('mdl_users')
    .select('id, auth_id, email, first_name, last_name, phone, fiscal_code, role, company_id, is_active, totp_enabled, last_login_at, login_count, created_at, updated_at, mdl_companies(id, business_name)')
    .eq('id', userId)
    .single();

  if (error || !data) {
    return Response.json({ success: false, error: 'Utente non trovato' }, { status: 404 });
  }

  return Response.json({ success: true, data });
};

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH — Update user
// ═══════════════════════════════════════════════════════════════════════════════

interface UpdateUserBody {
  first_name?: string;
  last_name?: string;
  phone?: string;
  fiscal_code?: string;
  role?: string;
  company_id?: string | null;
  is_active?: boolean;
  password?: string; // optional password reset
}

export const onRequestPatch: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !canManageUsers(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const userId = (context.params as any).id;

  // Fetch target user
  const { data: target, error: fetchError } = await supabaseAdmin
    .from('mdl_users')
    .select('id, auth_id, role, email')
    .eq('id', userId)
    .single();

  if (fetchError || !target) {
    return Response.json({ success: false, error: 'Utente non trovato' }, { status: 404 });
  }

  // Check permission: can actor modify this target?
  if (!canModifyUserRole(ctx.user.role, target.role)) {
    return Response.json({
      success: false,
      error: 'Non autorizzato a modificare questo utente',
    }, { status: 403 });
  }

  // Cannot modify yourself (prevents self-demotion accidents)
  if (target.id === ctx.user.id) {
    return Response.json({
      success: false,
      error: 'Non puoi modificare il tuo stesso account da questa interfaccia',
    }, { status: 400 });
  }

  try {
    const body = await context.request.json() as UpdateUserBody;
    const updates: Record<string, any> = {};
    const changes: string[] = [];

    // ── Updateable fields ─────────────────────────────────────────────
    if (body.first_name !== undefined) {
      updates.first_name = body.first_name.trim();
      changes.push('first_name');
    }
    if (body.last_name !== undefined) {
      updates.last_name = body.last_name.trim();
      changes.push('last_name');
    }
    if (body.phone !== undefined) {
      updates.phone = body.phone?.trim() || null;
      changes.push('phone');
    }
    if (body.fiscal_code !== undefined) {
      updates.fiscal_code = body.fiscal_code?.trim().toUpperCase() || null;
      changes.push('fiscal_code');
    }

    // ── Role change ───────────────────────────────────────────────────
    if (body.role !== undefined && body.role !== target.role) {
      const allowed = creatableRolesFor(ctx.user.role);
      if (!allowed.includes(body.role)) {
        return Response.json({
          success: false,
          error: `Non autorizzato ad assegnare il ruolo "${body.role}"`,
        }, { status: 403 });
      }
      updates.role = body.role;
      changes.push('role');
    }

    // ── Company binding ───────────────────────────────────────────────
    if (body.company_id !== undefined) {
      const finalRole = updates.role || target.role;
      const needsCompany = (COMPANY_BOUND_ROLES as readonly string[]).includes(finalRole);
      if (needsCompany && !body.company_id) {
        return Response.json({
          success: false,
          error: `Il ruolo "${finalRole}" richiede un company_id`,
        }, { status: 400 });
      }
      if (body.company_id) {
        const { data: comp } = await supabaseAdmin
          .from('mdl_companies')
          .select('id')
          .eq('id', body.company_id)
          .eq('is_active', true)
          .maybeSingle();
        if (!comp) {
          return Response.json({ success: false, error: 'Azienda non trovata o non attiva' }, { status: 400 });
        }
      }
      updates.company_id = body.company_id || null;
      changes.push('company_id');
    }

    // ── Active toggle ─────────────────────────────────────────────────
    if (body.is_active !== undefined) {
      updates.is_active = body.is_active;
      changes.push('is_active');
    }

    if (Object.keys(updates).length === 0 && !body.password) {
      return Response.json({ success: false, error: 'Nessuna modifica specificata' }, { status: 400 });
    }

    // ── Password reset (Supabase Auth) ────────────────────────────────
    if (body.password) {
      if (body.password.length < 8) {
        return Response.json({ success: false, error: 'La password deve essere di almeno 8 caratteri' }, { status: 400 });
      }
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(target.auth_id, {
        password: body.password,
      });
      if (pwError) {
        return Response.json({ success: false, error: `Errore reset password: ${pwError.message}` }, { status: 500 });
      }
      changes.push('password');
    }

    // ── Update MDL profile ────────────────────────────────────────────
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('mdl_users')
        .update(updates)
        .eq('id', userId)
        .select('id, email, first_name, last_name, phone, fiscal_code, role, company_id, is_active, updated_at')
        .single();

      if (updateError) {
        return Response.json({ success: false, error: updateError.message }, { status: 500 });
      }

      // Also update Supabase Auth metadata if name/role changed
      if (updates.first_name || updates.last_name || updates.role) {
        await supabaseAdmin.auth.admin.updateUserById(target.auth_id, {
          user_metadata: {
            first_name: updates.first_name || undefined,
            last_name: updates.last_name || undefined,
            role: updates.role || undefined,
          },
        });
      }

      // If deactivated, also ban from Auth
      if (updates.is_active === false) {
        await supabaseAdmin.auth.admin.updateUserById(target.auth_id, {
          ban_duration: '876000h', // ~100 years
        });
      } else if (updates.is_active === true) {
        await supabaseAdmin.auth.admin.updateUserById(target.auth_id, {
          ban_duration: 'none',
        });
      }

      // Audit
      await supabaseAdmin.from('mdl_audit_log').insert({
        user_id: ctx.user.id,
        user_role: ctx.user.role,
        action: updates.is_active === false ? 'user_deactivate' : 'user_update',
        target_type: 'user',
        target_id: userId,
        ip_address: ctx.ip,
        details: { changes, email: target.email },
      });

      return Response.json({ success: true, data: updated });
    }

    // Only password was changed (no profile updates)
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'user_password_reset',
      target_type: 'user',
      target_id: userId,
      ip_address: ctx.ip,
      details: { email: target.email },
    });

    return Response.json({ success: true, data: { id: userId, message: 'Password aggiornata' } });
  } catch (err: any) {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE — Soft-delete (deactivate) user
// ═══════════════════════════════════════════════════════════════════════════════

export const onRequestDelete: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !canManageUsers(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const userId = (context.params as any).id;

  // Fetch target
  const { data: target, error: fetchError } = await supabaseAdmin
    .from('mdl_users')
    .select('id, auth_id, role, email')
    .eq('id', userId)
    .single();

  if (fetchError || !target) {
    return Response.json({ success: false, error: 'Utente non trovato' }, { status: 404 });
  }

  if (!canModifyUserRole(ctx.user.role, target.role)) {
    return Response.json({ success: false, error: 'Non autorizzato a disattivare questo utente' }, { status: 403 });
  }

  if (target.id === ctx.user.id) {
    return Response.json({ success: false, error: 'Non puoi disattivare il tuo stesso account' }, { status: 400 });
  }

  // Soft delete: deactivate profile + ban Auth
  const { error: deactivateError } = await supabaseAdmin
    .from('mdl_users')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (deactivateError) {
    return Response.json({ success: false, error: deactivateError.message }, { status: 500 });
  }

  // Ban from Supabase Auth
  await supabaseAdmin.auth.admin.updateUserById(target.auth_id, {
    ban_duration: '876000h',
  });

  // Audit
  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: 'user_deactivate',
    target_type: 'user',
    target_id: userId,
    ip_address: ctx.ip,
    details: { email: target.email, role: target.role },
  });

  return Response.json({ success: true, data: { id: userId, message: 'Utente disattivato' } });
};

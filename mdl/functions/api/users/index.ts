/**
 * GET  /api/users — List platform users (MC/SA only)
 * POST /api/users — Create new user with Supabase Auth + MDL profile
 */

import {
  canManageUsers,
  creatableRolesFor,
  COMPANY_BOUND_ROLES,
} from '../lib/permissions';

// ═══════════════════════════════════════════════════════════════════════════════
// GET — List users
// ═══════════════════════════════════════════════════════════════════════════════

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !canManageUsers(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const url = new URL(context.request.url);
  const search = url.searchParams.get('search') || '';
  const role = url.searchParams.get('role') || '';
  const active = url.searchParams.get('active') !== 'false';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('mdl_users')
    .select('id, email, first_name, last_name, role, company_id, is_active, last_login_at, login_count, created_at, mdl_companies(id, business_name)', { count: 'exact' });

  if (active) query = query.eq('is_active', true);
  if (role) query = query.eq('role', role);
  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    data,
    pagination: { page, limit, total: count || 0, total_pages: Math.ceil((count || 0) / limit) },
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST — Create new user
// ═══════════════════════════════════════════════════════════════════════════════

interface CreateUserBody {
  email?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  company_id?: string;
  phone?: string;
  fiscal_code?: string;
}

export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !canManageUsers(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;

  try {
    const body = await context.request.json() as CreateUserBody;
    const { email, password, first_name, last_name, role, company_id, phone, fiscal_code } = body;

    // ── Validation ────────────────────────────────────────────────────
    if (!email || !password || !first_name || !last_name || !role) {
      return Response.json({
        success: false,
        error: 'Campi obbligatori: email, password, first_name, last_name, role',
      }, { status: 400 });
    }

    // Email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ success: false, error: 'Formato email non valido' }, { status: 400 });
    }

    // Password strength
    if (password.length < 8) {
      return Response.json({ success: false, error: 'La password deve essere di almeno 8 caratteri' }, { status: 400 });
    }

    // ── Role authorisation ────────────────────────────────────────────
    const allowed = creatableRolesFor(ctx.user.role);
    if (!allowed.includes(role)) {
      return Response.json({
        success: false,
        error: `Non autorizzato a creare utenti con ruolo "${role}"`,
      }, { status: 403 });
    }

    // ── Company binding ───────────────────────────────────────────────
    const needsCompany = (COMPANY_BOUND_ROLES as readonly string[]).includes(role);
    if (needsCompany && !company_id) {
      return Response.json({
        success: false,
        error: `Il ruolo "${role}" richiede un company_id`,
      }, { status: 400 });
    }

    // Validate company exists if provided
    if (company_id) {
      const { data: comp } = await supabaseAdmin
        .from('mdl_companies')
        .select('id')
        .eq('id', company_id)
        .eq('is_active', true)
        .maybeSingle();
      if (!comp) {
        return Response.json({ success: false, error: 'Azienda non trovata o non attiva' }, { status: 400 });
      }
    }

    // ── Check duplicate email in mdl_users ────────────────────────────
    const { data: existing } = await supabaseAdmin
      .from('mdl_users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (existing) {
      return Response.json({ success: false, error: 'Email già registrata nella piattaforma' }, { status: 409 });
    }

    // ── 1. Create Supabase Auth user ──────────────────────────────────
    // Direct REST call to admin/users endpoint with service_role key.
    // IMPORTANT: pass role='patient' in user_metadata because the Referti
    // module has a trigger (handle_new_user) on auth.users that casts
    // user_metadata.role to the Referti user_role enum. MDL roles are not
    // in that enum. The real MDL role is stored only in mdl_users.
    let authUserId: string;

    const supabaseUrl = ctx.env.SUPABASE_URL;
    const serviceKey = ctx.env.SUPABASE_SERVICE_KEY || ctx.env.SB_SERVICE_KEY;

    const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: { first_name, last_name, role: 'patient' },
      }),
    });

    const createBody: any = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      const errMsg = createBody?.msg || createBody?.error_description || createBody?.message || 'Errore sconosciuto';
      if (errMsg.includes('already been registered') || createRes.status === 422) {
        return Response.json({ success: false, error: 'Email già registrata in Supabase Auth' }, { status: 409 });
      }
      return Response.json({ success: false, error: `Errore Auth: ${errMsg}` }, { status: 500 });
    }

    if (!createBody.id) {
      return Response.json({ success: false, error: 'Errore creazione utente Auth (no id)' }, { status: 500 });
    }
    authUserId = createBody.id;

    // ── 2. Create MDL user profile ────────────────────────────────────
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('mdl_users')
      .insert({
        auth_id: authUserId,
        email: email.toLowerCase(),
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        role,
        company_id: company_id || null,
        phone: phone?.trim() || null,
        fiscal_code: fiscal_code?.trim().toUpperCase() || null,
        is_active: true,
      })
      .select('id, email, first_name, last_name, role, company_id, is_active, created_at')
      .single();

    if (profileError) {
      // Rollback: delete auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authUserId);
      return Response.json({ success: false, error: `Errore profilo: ${profileError.message}` }, { status: 500 });
    }

    // ── 3. Audit log ──────────────────────────────────────────────────
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'user_create',
      target_type: 'user',
      target_id: profile.id,
      ip_address: ctx.ip,
      details: { email: profile.email, role: profile.role, company_id: profile.company_id },
    });

    return Response.json({ success: true, data: profile }, { status: 201 });
  } catch (err: any) {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

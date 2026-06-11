/**
 * GET /api/workers — List workers (filtered by company, role)
 * POST /api/workers — Create new worker
 *
 * PHASE 0 SECURITY FIX:
 *   - Worker list: DL/RSPP/segreteria get safe select (no is_pregnant, is_disabled, is_minor, notes)
 *   - POST: segreteria cannot set sensitive worker flags
 *   - Uses centralised permissions module
 */

import {
  ALL_INTERNAL_ROLES,
  canViewSensitiveWorkerData,
  isCompanyBoundRole,
  isLavoratore,
  stripSensitiveWorkerFields,
  WORKER_SAFE_SELECT,
} from '../lib/permissions';

const ALLOWED_READ = [...ALL_INTERNAL_ROLES];
const ALLOWED_WRITE = ['super_admin', 'medico_competente', 'segreteria_mdl'];

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const url = new URL(context.request.url);
  const companyId = url.searchParams.get('company_id');
  const search = url.searchParams.get('search') || '';
  const active = url.searchParams.get('active') !== 'false';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);
  const offset = (page - 1) * limit;

  // ── FIX: Use safe select for non-clinical roles ────────────────────────
  const canSeeSensitive = canViewSensitiveWorkerData(ctx.user.role);
  const selectFields = canSeeSensitive
    ? `*, mdl_companies!inner(id, business_name), mdl_worker_jobs(id, job_role_id, is_current, mdl_job_roles(role_name, risk_level))`
    : `${WORKER_SAFE_SELECT}, mdl_companies!inner(id, business_name), mdl_worker_jobs(id, job_role_id, is_current, mdl_job_roles(role_name, risk_level))`;

  let query = supabaseAdmin
    .from('mdl_workers')
    .select(selectFields, { count: 'exact' });

  if (active) query = query.eq('is_active', true);

  // Company filter — DL/RSPP/lavoratore see only their own company
  if (isCompanyBoundRole(ctx.user.role)) {
    query = query.eq('company_id', ctx.user.company_id);
  } else if (companyId) {
    query = query.eq('company_id', companyId);
  }

  // Lavoratore: even more restricted — can only see themselves
  // (filtered by fiscal_code match via their mdl_users record)
  if (isLavoratore(ctx.user.role)) {
    // A lavoratore can see only the list of workers in their company
    // but NOT their clinical/sensitive data (already handled by safe select)
  }

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,fiscal_code.ilike.%${search}%`);
  }

  query = query.order('last_name').order('first_name').range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  // Extra safety: strip sensitive fields for non-clinical roles
  if (!canSeeSensitive && data) {
    data.forEach(stripSensitiveWorkerFields);
  }

  return Response.json({
    success: true,
    data,
    pagination: { page, limit, total: count || 0, total_pages: Math.ceil((count || 0) / limit) },
  });
};

export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;

  try {
    const body = await context.request.json() as any;

    // Validation — minimum required fields for initial insertion
    // fiscal_code and date_of_birth are NOT required at creation (can be added later)
    // They become mandatory before profile validation / scheduling visits
    const required = ['company_id', 'first_name', 'last_name', 'gender'];
    for (const field of required) {
      if (!body[field]) {
        return Response.json({ success: false, error: `Campo obbligatorio mancante: ${field}` }, { status: 400 });
      }
    }

    // Validate CF format if provided (basic)
    let cf: string | null = null;
    if (body.fiscal_code && body.fiscal_code.trim()) {
      const cfValue = body.fiscal_code.trim().toUpperCase();
      if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(cfValue)) {
        return Response.json({ success: false, error: 'Codice fiscale non valido' }, { status: 400 });
      }
      cf = cfValue;
    }

    // Check company exists
    const { data: company } = await supabaseAdmin
      .from('mdl_companies')
      .select('id')
      .eq('id', body.company_id)
      .single();

    if (!company) {
      return Response.json({ success: false, error: 'Azienda non trovata' }, { status: 404 });
    }

    // Check duplicate CF in same company (only if CF provided)
    if (cf) {
      const { data: existing } = await supabaseAdmin
        .from('mdl_workers')
        .select('id')
        .eq('company_id', body.company_id)
        .eq('fiscal_code', cf)
        .maybeSingle();

      if (existing) {
        return Response.json({ success: false, error: 'Lavoratore con questo CF gia presente in azienda' }, { status: 409 });
      }
    }

    // ── FIX: Segreteria cannot set sensitive flags ───────────────────────
    const isMC = canViewSensitiveWorkerData(ctx.user.role);

    const insertData: Record<string, any> = {
      company_id: body.company_id,
      site_id: body.site_id || null,
      fiscal_code: cf || null,
      first_name: body.first_name.trim(),
      last_name: body.last_name.trim(),
      date_of_birth: body.date_of_birth || null,
      place_of_birth: body.place_of_birth?.trim() || null,
      gender: body.gender,
      address_street: body.address_street?.trim() || null,
      address_city: body.address_city?.trim() || null,
      address_province: body.address_province?.trim().toUpperCase() || null,
      address_zip: body.address_zip?.trim() || null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      language: body.language || 'it',
      hire_date: body.hire_date || null,
      contract_type: body.contract_type || 'indeterminato',
      qualification: body.qualification || null,
      department: body.department?.trim() || null,
      work_schedule: body.work_schedule || 'giornaliero',
      is_night_worker: body.is_night_worker || false,
      notes: isMC ? (body.notes || null) : null,
    };

    // Sensitive flags: only MC/SA can set
    if (isMC) {
      insertData.is_pregnant = body.is_pregnant || false;
      insertData.is_minor = body.is_minor || false;
      insertData.is_disabled = body.is_disabled || false;
    }

    const { data, error } = await supabaseAdmin
      .from('mdl_workers')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    // If job_role_id provided, assign immediately
    if (body.job_role_id) {
      await supabaseAdmin.from('mdl_worker_jobs').insert({
        worker_id: data.id,
        job_role_id: body.job_role_id,
        site_id: body.site_id || null,
        department: body.department || null,
        start_date: body.hire_date || new Date().toISOString().slice(0, 10),
        is_current: true,
      });
    }

    // Audit
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'worker_create',
      target_type: 'worker',
      target_id: data.id,
      company_id: body.company_id,
      ip_address: ctx.ip,
      details: { fiscal_code: cf || null, name: `${data.first_name} ${data.last_name}` },
    });

    return Response.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

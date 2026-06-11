/**
 * GET /api/companies/:id — Get single company with sites and contacts
 * PATCH /api/companies/:id — Update company
 * DELETE /api/companies/:id — Deactivate company (soft delete)
 */

const ALLOWED_ROLES_READ = ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl', 'datore_lavoro', 'rspp', 'lavoratore'];
const ALLOWED_ROLES_WRITE = ['super_admin', 'medico_competente', 'segreteria_mdl'];

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_ROLES_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const id = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  // DL/RSPP/lavoratore can only see their own company
  if (['datore_lavoro', 'rspp', 'lavoratore'].includes(ctx.user.role) && id !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('mdl_companies')
    .select(`
      *,
      mdl_company_sites(*),
      mdl_safety_contacts(*),
      mdl_job_roles(id, role_name, risk_level, risk_factors, is_active)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    return Response.json({ success: false, error: 'Azienda non trovata' }, { status: 404 });
  }

  return Response.json({ success: true, data });
};

export const onRequestPatch: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_ROLES_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const id = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  try {
    const body = await context.request.json() as any;

    // Only allow specific fields
    const allowedFields = [
      'business_name', 'vat_number', 'fiscal_code', 'ateco_code', 'sector', 'risk_level',
      'address_street', 'address_city', 'address_province', 'address_zip', 'address_region',
      'pec_email', 'phone', 'email', 'total_employees',
      'contract_type', 'contract_start', 'contract_end', 'contract_notes', 'notes', 'is_active',
    ];

    const patch: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    if (Object.keys(patch).length === 0) {
      return Response.json({ success: false, error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('mdl_companies')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    // Audit
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'company_update',
      target_type: 'company',
      target_id: id,
      company_id: id,
      ip_address: ctx.ip,
      details: { updated_fields: Object.keys(patch) },
    });

    return Response.json({ success: true, data });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

export const onRequestDelete: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !['super_admin', 'medico_competente'].includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const id = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  // Soft delete (deactivate)
  const { error } = await supabaseAdmin
    .from('mdl_companies')
    .update({ is_active: false })
    .eq('id', id);

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: 'company_delete',
    target_type: 'company',
    target_id: id,
    ip_address: ctx.ip,
    risk_level: 'high',
  });

  return Response.json({ success: true, message: 'Azienda disattivata' });
};

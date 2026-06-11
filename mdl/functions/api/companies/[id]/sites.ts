/**
 * Company Sites API — /api/companies/:id/sites
 *
 * GET    → List all sites for the company
 * POST   → Create a new site
 *
 * Roles:
 *   MC/segreteria       → full CRUD on all companies
 *   datore_lavoro/rspp  → CRUD on own company only
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl'];
const ALLOWED_READ = [...MC_ROLES, 'datore_lavoro', 'rspp'];
const ALLOWED_WRITE = [...MC_ROLES, 'datore_lavoro'];

// ─── GET ─────────────────────────────────────────────────────────────────────
export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const companyId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  // DL/RSPP only their own company
  if (['datore_lavoro', 'rspp'].includes(ctx.user.role) && companyId !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('mdl_company_sites')
    .select('*')
    .eq('company_id', companyId)
    .order('is_primary', { ascending: false })
    .order('site_name');

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, data });
};

// ─── POST ────────────────────────────────────────────────────────────────────
export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const companyId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  if (['datore_lavoro'].includes(ctx.user.role) && companyId !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ success: false, error: 'JSON non valido' }, { status: 400 });
  }

  // Validate required fields
  if (!body.site_name?.trim()) {
    return Response.json({ success: false, error: 'Nome sede obbligatorio' }, { status: 400 });
  }

  // If setting as primary, unset other primaries
  if (body.is_primary) {
    await supabaseAdmin
      .from('mdl_company_sites')
      .update({ is_primary: false })
      .eq('company_id', companyId);
  }

  const insertData = {
    company_id: companyId,
    site_name: body.site_name.trim(),
    address_street: body.address_street?.trim() || null,
    address_city: body.address_city?.trim() || null,
    address_province: body.address_province?.trim()?.toUpperCase()?.substring(0, 2) || null,
    address_zip: body.address_zip?.trim()?.substring(0, 5) || null,
    is_primary: !!body.is_primary,
    employee_count: parseInt(body.employee_count) || 0,
    notes: body.notes?.trim() || null,
  };

  const { data, error } = await supabaseAdmin
    .from('mdl_company_sites')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  // Audit log
  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    action: 'admin_action',
    entity_type: 'company_site',
    entity_id: data.id,
    details: { action: 'site_create', company_id: companyId, site_name: insertData.site_name },
    ip_address: ctx.ip,
  });

  return Response.json({ success: true, data }, { status: 201 });
};

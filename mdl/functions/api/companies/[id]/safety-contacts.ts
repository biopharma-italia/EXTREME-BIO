/**
 * Company Safety Contacts API — /api/companies/:id/safety-contacts
 *
 * GET    → List all safety contacts for the company
 * POST   → Create a new safety contact
 *
 * Roles:
 *   MC/segreteria       → full CRUD on all companies
 *   datore_lavoro/rspp  → CRUD on own company only
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl'];
const ALLOWED_READ = [...MC_ROLES, 'datore_lavoro', 'rspp'];
const ALLOWED_WRITE = [...MC_ROLES, 'datore_lavoro'];

const VALID_ROLES = [
  'datore_lavoro', 'rspp', 'aspp', 'mc', 'rls',
  'primo_soccorso', 'antincendio', 'preposto', 'dirigente',
];

// ─── GET ─────────────────────────────────────────────────────────────────────
export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const companyId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  if (['datore_lavoro', 'rspp'].includes(ctx.user.role) && companyId !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  let query = supabaseAdmin
    .from('mdl_safety_contacts')
    .select('*, mdl_company_sites(id, site_name)')
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('role')
    .order('full_name');

  const { data, error } = await query;

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

  if (ctx.user.role === 'datore_lavoro' && companyId !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ success: false, error: 'JSON non valido' }, { status: 400 });
  }

  // Validate required fields
  if (!body.role || !VALID_ROLES.includes(body.role)) {
    return Response.json({ success: false, error: `Ruolo non valido. Valori ammessi: ${VALID_ROLES.join(', ')}` }, { status: 400 });
  }
  if (!body.full_name?.trim()) {
    return Response.json({ success: false, error: 'Nome completo obbligatorio' }, { status: 400 });
  }

  // Validate site_id belongs to same company
  if (body.site_id) {
    const { data: site } = await supabaseAdmin
      .from('mdl_company_sites')
      .select('id')
      .eq('id', body.site_id)
      .eq('company_id', companyId)
      .single();
    if (!site) {
      return Response.json({ success: false, error: 'Sede non trovata per questa azienda' }, { status: 400 });
    }
  }

  // Validate CF if provided
  if (body.fiscal_code?.trim()) {
    const cf = body.fiscal_code.trim().toUpperCase();
    if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(cf)) {
      return Response.json({ success: false, error: 'Codice fiscale non valido' }, { status: 400 });
    }
  }

  const insertData = {
    company_id: companyId,
    site_id: body.site_id || null,
    role: body.role,
    full_name: body.full_name.trim(),
    fiscal_code: body.fiscal_code?.trim()?.toUpperCase() || null,
    email: body.email?.trim()?.toLowerCase() || null,
    phone: body.phone?.trim() || null,
    appointment_date: body.appointment_date || null,
    appointment_expiry: body.appointment_expiry || null,
    is_external: !!body.is_external,
    notes: body.notes?.trim() || null,
    is_active: true,
  };

  const { data, error } = await supabaseAdmin
    .from('mdl_safety_contacts')
    .insert(insertData)
    .select('*, mdl_company_sites(id, site_name)')
    .single();

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    action: 'admin_action',
    entity_type: 'safety_contact',
    entity_id: data.id,
    details: { action: 'safety_contact_create', company_id: companyId, role: insertData.role, name: insertData.full_name },
    ip_address: ctx.ip,
  });

  return Response.json({ success: true, data }, { status: 201 });
};

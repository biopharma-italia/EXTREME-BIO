/**
 * GET /api/companies — List companies (filtered by role)
 * POST /api/companies — Create new company
 *
 * COMPANY-SCOPED ISOLATION:
 *   - DL/RSPP/lavoratore: see only their own company
 *   - All other authorised roles: see all companies
 */

const ALLOWED_ROLES_READ = ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl', 'datore_lavoro', 'rspp', 'lavoratore'];
const ALLOWED_ROLES_WRITE = ['super_admin', 'medico_competente', 'segreteria_mdl'];

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_ROLES_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const url = new URL(context.request.url);
  const search = url.searchParams.get('search') || '';
  const active = url.searchParams.get('active') !== 'false';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('mdl_companies')
    .select('*, mdl_company_sites(count)', { count: 'exact' });

  if (active) query = query.eq('is_active', true);

  // DL/RSPP/lavoratore only see their own company
  if (['datore_lavoro', 'rspp', 'lavoratore'].includes(ctx.user.role)) {
    query = query.eq('id', ctx.user.company_id);
  }

  if (search) {
    query = query.or(`business_name.ilike.%${search}%,vat_number.ilike.%${search}%,fiscal_code.ilike.%${search}%`);
  }

  query = query.order('business_name').range(offset, offset + limit - 1);

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

export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_ROLES_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;

  try {
    const body = await context.request.json() as any;

    // Validation
    if (!body.business_name || !body.vat_number) {
      return Response.json({ success: false, error: 'Ragione sociale e P.IVA sono obbligatori' }, { status: 400 });
    }

    if (!/^\d{11}$/.test(body.vat_number)) {
      return Response.json({ success: false, error: 'Partita IVA non valida (11 cifre)' }, { status: 400 });
    }

    // Check duplicate VAT
    const { data: existing } = await supabaseAdmin
      .from('mdl_companies')
      .select('id')
      .eq('vat_number', body.vat_number)
      .maybeSingle();

    if (existing) {
      return Response.json({ success: false, error: 'Azienda con questa P.IVA gia presente' }, { status: 409 });
    }

    const insertData = {
      business_name: body.business_name.trim(),
      vat_number: body.vat_number.trim(),
      fiscal_code: body.fiscal_code?.trim() || null,
      ateco_code: body.ateco_code?.trim() || null,
      sector: body.sector?.trim() || null,
      risk_level: body.risk_level || 'basso',
      address_street: body.address_street?.trim() || null,
      address_city: body.address_city?.trim() || null,
      address_province: body.address_province?.trim().toUpperCase() || null,
      address_zip: body.address_zip?.trim() || null,
      address_region: body.address_region?.trim() || null,
      pec_email: body.pec_email?.trim() || null,
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      total_employees: body.total_employees || 0,
      contract_type: body.contract_type || null,
      contract_start: body.contract_start || null,
      contract_end: body.contract_end || null,
      notes: body.notes || null,
    };

    const { data, error } = await supabaseAdmin
      .from('mdl_companies')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    // Audit
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'company_create',
      target_type: 'company',
      target_id: data.id,
      ip_address: ctx.ip,
      details: { business_name: data.business_name, vat_number: data.vat_number },
    });

    return Response.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

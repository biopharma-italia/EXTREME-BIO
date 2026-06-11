/**
 * Site Detail API — /api/sites/:id
 *
 * PATCH  → Update site
 * DELETE → Delete site (hard delete, CASCADE handled by FK)
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl'];
const ALLOWED_WRITE = [...MC_ROLES, 'datore_lavoro'];

export const onRequestPatch: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const siteId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  // Verify site exists and check company scope
  const { data: site } = await supabaseAdmin
    .from('mdl_company_sites')
    .select('id, company_id')
    .eq('id', siteId)
    .single();

  if (!site) {
    return Response.json({ success: false, error: 'Sede non trovata' }, { status: 404 });
  }

  if (ctx.user.role === 'datore_lavoro' && site.company_id !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ success: false, error: 'JSON non valido' }, { status: 400 });
  }

  const allowedFields = ['site_name', 'address_street', 'address_city', 'address_province', 'address_zip', 'is_primary', 'employee_count', 'notes'];
  const updateData: Record<string, any> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === 'address_province') {
        updateData[field] = body[field]?.trim()?.toUpperCase()?.substring(0, 2) || null;
      } else if (field === 'employee_count') {
        updateData[field] = parseInt(body[field]) || 0;
      } else if (field === 'is_primary') {
        updateData[field] = !!body[field];
      } else {
        updateData[field] = typeof body[field] === 'string' ? body[field].trim() || null : body[field];
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ success: false, error: 'Nessun campo da aggiornare' }, { status: 400 });
  }

  // If setting as primary, unset others
  if (updateData.is_primary) {
    await supabaseAdmin
      .from('mdl_company_sites')
      .update({ is_primary: false })
      .eq('company_id', site.company_id)
      .neq('id', siteId);
  }

  const { data, error } = await supabaseAdmin
    .from('mdl_company_sites')
    .update(updateData)
    .eq('id', siteId)
    .select()
    .single();

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    action: 'admin_action',
    entity_type: 'company_site',
    entity_id: siteId,
    details: { action: 'site_update', fields: Object.keys(updateData) },
    ip_address: ctx.ip,
  });

  return Response.json({ success: true, data });
};

export const onRequestDelete: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const siteId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  const { data: site } = await supabaseAdmin
    .from('mdl_company_sites')
    .select('id, company_id, site_name')
    .eq('id', siteId)
    .single();

  if (!site) {
    return Response.json({ success: false, error: 'Sede non trovata' }, { status: 404 });
  }

  if (ctx.user.role === 'datore_lavoro' && site.company_id !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  // Check if site has workers assigned
  const { count } = await supabaseAdmin
    .from('mdl_workers')
    .select('id', { count: 'exact', head: true })
    .eq('site_id', siteId)
    .eq('is_active', true);

  if (count && count > 0) {
    return Response.json({ success: false, error: `Impossibile eliminare: ${count} lavoratori assegnati a questa sede. Riassegnare prima i lavoratori.` }, { status: 409 });
  }

  const { error } = await supabaseAdmin
    .from('mdl_company_sites')
    .delete()
    .eq('id', siteId);

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    action: 'admin_action',
    entity_type: 'company_site',
    entity_id: siteId,
    details: { action: 'site_delete', site_name: site.site_name, company_id: site.company_id },
    ip_address: ctx.ip,
  });

  return Response.json({ success: true });
};

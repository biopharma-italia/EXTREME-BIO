/**
 * Safety Contact Detail — /api/safety-contacts/:id
 *
 * PATCH  → Update safety contact
 * DELETE → Soft-delete safety contact (is_active = false)
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl'];
const ALLOWED_WRITE = [...MC_ROLES, 'datore_lavoro'];

const VALID_ROLES = [
  'datore_lavoro', 'rspp', 'aspp', 'mc', 'rls',
  'primo_soccorso', 'antincendio', 'preposto', 'dirigente',
];

export const onRequestPatch: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const contactId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  const { data: contact } = await supabaseAdmin
    .from('mdl_safety_contacts')
    .select('id, company_id')
    .eq('id', contactId)
    .single();

  if (!contact) {
    return Response.json({ success: false, error: 'Contatto non trovato' }, { status: 404 });
  }

  if (ctx.user.role === 'datore_lavoro' && contact.company_id !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ success: false, error: 'JSON non valido' }, { status: 400 });
  }

  // Validate role if changed
  if (body.role && !VALID_ROLES.includes(body.role)) {
    return Response.json({ success: false, error: `Ruolo non valido. Valori: ${VALID_ROLES.join(', ')}` }, { status: 400 });
  }

  // Validate CF if provided
  if (body.fiscal_code?.trim()) {
    const cf = body.fiscal_code.trim().toUpperCase();
    if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(cf)) {
      return Response.json({ success: false, error: 'Codice fiscale non valido' }, { status: 400 });
    }
  }

  const allowedFields = ['role', 'full_name', 'fiscal_code', 'email', 'phone', 'site_id', 'appointment_date', 'appointment_expiry', 'is_external', 'notes', 'document_path'];
  const updateData: Record<string, any> = {};
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      if (field === 'fiscal_code') {
        updateData[field] = body[field]?.trim()?.toUpperCase() || null;
      } else if (field === 'email') {
        updateData[field] = body[field]?.trim()?.toLowerCase() || null;
      } else if (field === 'is_external') {
        updateData[field] = !!body[field];
      } else {
        updateData[field] = typeof body[field] === 'string' ? body[field].trim() || null : body[field];
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return Response.json({ success: false, error: 'Nessun campo da aggiornare' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('mdl_safety_contacts')
    .update(updateData)
    .eq('id', contactId)
    .select('*, mdl_company_sites(id, site_name)')
    .single();

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    action: 'admin_action',
    entity_type: 'safety_contact',
    entity_id: contactId,
    details: { action: 'safety_contact_update', fields: Object.keys(updateData) },
    ip_address: ctx.ip,
  });

  return Response.json({ success: true, data });
};

export const onRequestDelete: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const contactId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  const { data: contact } = await supabaseAdmin
    .from('mdl_safety_contacts')
    .select('id, company_id, full_name, role')
    .eq('id', contactId)
    .single();

  if (!contact) {
    return Response.json({ success: false, error: 'Contatto non trovato' }, { status: 404 });
  }

  if (ctx.user.role === 'datore_lavoro' && contact.company_id !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  // Soft delete
  const { error } = await supabaseAdmin
    .from('mdl_safety_contacts')
    .update({ is_active: false })
    .eq('id', contactId);

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    action: 'admin_action',
    entity_type: 'safety_contact',
    entity_id: contactId,
    details: { action: 'safety_contact_deactivate', name: contact.full_name, role: contact.role },
    ip_address: ctx.ip,
  });

  return Response.json({ success: true });
};

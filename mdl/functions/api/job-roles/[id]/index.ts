/**
 * PATCH  /api/job-roles/:id — Aggiorna una mansione
 * DELETE /api/job-roles/:id — Disattiva una mansione (soft delete)
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore'];
const ALLOWED_WRITE = [...MC_ROLES, 'segreteria_mdl'];
const RISK_LEVELS = ['basso', 'medio', 'alto'];

function toArray(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

export const onRequestPatch: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }
  const id = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  const { data: role } = await supabaseAdmin
    .from('mdl_job_roles').select('id, company_id').eq('id', id).maybeSingle();
  if (!role) return Response.json({ success: false, error: 'Mansione non trovata' }, { status: 404 });

  try {
    const body = await context.request.json() as any;
    const patch: Record<string, any> = {};
    if (body.role_name !== undefined) patch.role_name = String(body.role_name).trim();
    if (body.description !== undefined) patch.description = body.description || null;
    if (body.dvr_reference !== undefined) patch.dvr_reference = body.dvr_reference || null;
    if (body.risk_factors !== undefined) patch.risk_factors = toArray(body.risk_factors);
    if (body.risk_level !== undefined && RISK_LEVELS.includes(body.risk_level)) patch.risk_level = body.risk_level;
    if (body.is_active !== undefined) patch.is_active = !!body.is_active;

    if (Object.keys(patch).length === 0) {
      return Response.json({ success: false, error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('mdl_job_roles').update(patch).eq('id', id).select().single();
    if (error) {
      if ((error as any).code === '23505') {
        return Response.json({ success: false, error: 'Esiste già una mansione con questo nome' }, { status: 409 });
      }
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id, user_role: ctx.user.role,
      action: 'company_update', target_type: 'job_role', target_id: id,
      company_id: role.company_id, ip_address: ctx.ip, details: { fields: Object.keys(patch) },
    });

    return Response.json({ success: true, data });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

export const onRequestDelete: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }
  const id = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  const { data: role } = await supabaseAdmin
    .from('mdl_job_roles').select('id, company_id').eq('id', id).maybeSingle();
  if (!role) return Response.json({ success: false, error: 'Mansione non trovata' }, { status: 404 });

  const { error } = await supabaseAdmin.from('mdl_job_roles').update({ is_active: false }).eq('id', id);
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });

  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id, user_role: ctx.user.role,
    action: 'company_update', target_type: 'job_role', target_id: id,
    company_id: role.company_id, ip_address: ctx.ip, risk_level: 'low', details: { action: 'deactivate' },
  });

  return Response.json({ success: true, message: 'Mansione disattivata' });
};

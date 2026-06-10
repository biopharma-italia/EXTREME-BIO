/**
 * GET  /api/companies/:id/job-roles — Elenco mansioni dell'azienda
 * POST /api/companies/:id/job-roles — Crea una nuova mansione
 *   Body: { role_name, risk_level?, risk_factors?, description?, dvr_reference? }
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore'];
const ALLOWED_READ = [...MC_ROLES, 'segreteria_mdl', 'datore_lavoro', 'rspp'];
const ALLOWED_WRITE = [...MC_ROLES, 'segreteria_mdl'];
const RISK_LEVELS = ['basso', 'medio', 'alto'];

function toArray(v: any): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

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

  const { data, error } = await supabaseAdmin
    .from('mdl_job_roles')
    .select('id, role_name, description, risk_factors, risk_level, dvr_reference, is_active, mdl_worker_jobs(count)')
    .eq('company_id', companyId)
    .order('role_name');

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });
  return Response.json({ success: true, data: data || [] });
};

export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }
  const companyId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  try {
    const body = await context.request.json() as any;
    if (!body.role_name || !String(body.role_name).trim()) {
      return Response.json({ success: false, error: 'Nome mansione obbligatorio' }, { status: 400 });
    }
    const riskLevel = RISK_LEVELS.includes(body.risk_level) ? body.risk_level : 'basso';

    const { data, error } = await supabaseAdmin
      .from('mdl_job_roles')
      .insert({
        company_id: companyId,
        role_name: String(body.role_name).trim(),
        description: body.description || null,
        risk_factors: toArray(body.risk_factors),
        risk_level: riskLevel,
        dvr_reference: body.dvr_reference || null,
      })
      .select()
      .single();

    if (error) {
      if ((error as any).code === '23505') {
        return Response.json({ success: false, error: 'Mansione già presente per questa azienda' }, { status: 409 });
      }
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id, user_role: ctx.user.role,
      action: 'company_update', target_type: 'job_role', target_id: data.id,
      company_id: companyId, ip_address: ctx.ip, details: { role_name: data.role_name },
    });

    return Response.json({ success: true, data }, { status: 201 });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

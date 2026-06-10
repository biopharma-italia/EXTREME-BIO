/**
 * PATCH  /api/protocol-templates/:id — Aggiorna un modello (campi + esami)
 *   Se "exams" è presente, sostituisce TUTTI gli esami del modello.
 * DELETE /api/protocol-templates/:id — Disattiva un modello (soft delete)
 *
 * Uses existing mdl_protocols + mdl_protocol_exams tables.
 * Templates are protocols where company_id = TEMPLATE_COMPANY_ID.
 */

const TEMPLATE_COMPANY_ID = '00000000-0000-4000-a000-000000000001';
const WRITE_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore'];
const PERIODICITY = ['semestrale', 'annuale', 'biennale', 'triennale', 'quinquennale', 'una_tantum'];

function normalizeExams(raw: any): any[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e: any) => e && e.exam_code && e.exam_name)
    .map((e: any, i: number) => ({
      exam_code: String(e.exam_code).trim().slice(0, 50),
      exam_name: String(e.exam_name).trim().slice(0, 200),
      exam_category: ['ematochimico', 'strumentale', 'specialistico', 'tossicologico'].includes(e.exam_category) ? e.exam_category : null,
      periodicity: PERIODICITY.includes(e.periodicity) ? e.periodicity : 'annuale',
      is_mandatory: e.is_mandatory !== false,
      sort_order: typeof e.sort_order === 'number' ? e.sort_order : i + 1,
    }));
}

export const onRequestPatch: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !WRITE_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const id = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  try {
    // Verify the protocol belongs to the template company
    const { data: existing } = await supabaseAdmin
      .from('mdl_protocols')
      .select('id, company_id, job_role_id')
      .eq('id', id)
      .eq('company_id', TEMPLATE_COMPANY_ID)
      .single();

    if (!existing) {
      return Response.json({ success: false, error: 'Modello non trovato' }, { status: 404 });
    }

    const body = await context.request.json() as any;

    // Update protocol fields
    const protocolPatch: Record<string, any> = {};
    if (body.name !== undefined) protocolPatch.protocol_name = String(body.name).trim();
    if (body.visit_periodicity !== undefined && PERIODICITY.includes(body.visit_periodicity)) {
      protocolPatch.visit_periodicity = body.visit_periodicity;
    }

    // Build notes from description + legal_reference
    if (body.description !== undefined || body.legal_reference !== undefined) {
      let notes = body.description || '';
      if (body.legal_reference) {
        notes = notes ? `${notes} Rif. ${body.legal_reference}` : `Rif. ${body.legal_reference}`;
      }
      protocolPatch.notes = notes || null;
    }

    if (Object.keys(protocolPatch).length > 0) {
      const { error: uErr } = await supabaseAdmin
        .from('mdl_protocols')
        .update(protocolPatch)
        .eq('id', id);
      if (uErr) return Response.json({ success: false, error: uErr.message }, { status: 500 });
    }

    // Update job role fields (risk_factors, description, role_name)
    if (existing.job_role_id) {
      const rolePatch: Record<string, any> = {};
      if (body.name !== undefined) rolePatch.role_name = String(body.name).trim();
      if (body.description !== undefined) rolePatch.description = body.description || null;
      if (body.risk_factors !== undefined) {
        rolePatch.risk_factors = Array.isArray(body.risk_factors)
          ? body.risk_factors
          : (typeof body.risk_factors === 'string' ? body.risk_factors.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
      }
      if (Object.keys(rolePatch).length > 0) {
        await supabaseAdmin.from('mdl_job_roles').update(rolePatch).eq('id', existing.job_role_id);
      }
    }

    // Replace exams if provided
    if (body.exams !== undefined) {
      const exams = normalizeExams(body.exams).map((e) => ({ ...e, protocol_id: id }));
      await supabaseAdmin.from('mdl_protocol_exams').delete().eq('protocol_id', id);
      if (exams.length > 0) {
        const { error: exErr } = await supabaseAdmin.from('mdl_protocol_exams').insert(exams);
        if (exErr) return Response.json({ success: false, error: 'Errore esami: ' + exErr.message }, { status: 500 });
      }
    }

    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id, user_role: ctx.user.role,
      action: 'protocol_update', target_type: 'protocol_template', target_id: id,
      ip_address: ctx.ip, details: { fields: Object.keys(protocolPatch), exams_replaced: body.exams !== undefined },
    }).catch(() => {});

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

export const onRequestDelete: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !WRITE_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const id = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  // Verify the protocol belongs to the template company
  const { data: existing } = await supabaseAdmin
    .from('mdl_protocols')
    .select('id, company_id')
    .eq('id', id)
    .eq('company_id', TEMPLATE_COMPANY_ID)
    .single();

  if (!existing) {
    return Response.json({ success: false, error: 'Modello non trovato' }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from('mdl_protocols')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });

  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id, user_role: ctx.user.role,
    action: 'protocol_update', target_type: 'protocol_template', target_id: id,
    ip_address: ctx.ip, risk_level: 'medium', details: { action: 'deactivate' },
  }).catch(() => {});

  return Response.json({ success: true, message: 'Modello disattivato' });
};

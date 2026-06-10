/**
 * PATCH  /api/protocols/:id — Aggiorna un protocollo aziendale (campi + esami)
 *   Se "exams" è presente, sostituisce TUTTI gli esami del protocollo.
 * DELETE /api/protocols/:id — Disattiva il protocollo (soft delete)
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore'];
const WRITE_ROLES = [...MC_ROLES, 'segreteria_mdl'];
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

  // Recupera il protocollo (per company_id, scoping DL/RSPP e audit)
  const { data: proto } = await supabaseAdmin
    .from('mdl_protocols')
    .select('id, company_id')
    .eq('id', id)
    .maybeSingle();
  if (!proto) {
    return Response.json({ success: false, error: 'Protocollo non trovato' }, { status: 404 });
  }

  try {
    const body = await context.request.json() as any;

    const patch: Record<string, any> = {};
    if (body.protocol_name !== undefined) patch.protocol_name = String(body.protocol_name).trim();
    if (body.version !== undefined) patch.version = String(body.version).trim();
    if (body.notes !== undefined) patch.notes = body.notes || null;
    if (body.is_active !== undefined) patch.is_active = !!body.is_active;
    if (body.visit_periodicity !== undefined && PERIODICITY.includes(body.visit_periodicity)) patch.visit_periodicity = body.visit_periodicity;

    if (Object.keys(patch).length > 0) {
      const { error: uErr } = await supabaseAdmin.from('mdl_protocols').update(patch).eq('id', id);
      if (uErr) return Response.json({ success: false, error: uErr.message }, { status: 500 });
    }

    // Sostituzione esami (se forniti)
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
      action: 'protocol_update', target_type: 'protocol', target_id: id,
      company_id: proto.company_id, ip_address: ctx.ip,
      details: { fields: Object.keys(patch), exams_replaced: body.exams !== undefined },
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

export const onRequestDelete: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !MC_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const id = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  const { data: proto } = await supabaseAdmin
    .from('mdl_protocols').select('id, company_id').eq('id', id).maybeSingle();
  if (!proto) return Response.json({ success: false, error: 'Protocollo non trovato' }, { status: 404 });

  const { error } = await supabaseAdmin.from('mdl_protocols').update({ is_active: false }).eq('id', id);
  if (error) return Response.json({ success: false, error: error.message }, { status: 500 });

  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id, user_role: ctx.user.role,
    action: 'protocol_update', target_type: 'protocol', target_id: id,
    company_id: proto.company_id, ip_address: ctx.ip, risk_level: 'medium',
    details: { action: 'deactivate' },
  });

  return Response.json({ success: true, message: 'Protocollo disattivato' });
};

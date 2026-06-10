/**
 * GET  /api/companies/:id/protocols — List all protocols for a company
 *   Returns protocols with their job_roles and protocol_exams
 * POST /api/companies/:id/protocols — Crea un protocollo per una mansione a
 *   partire da un template standard (clona template + esami).
 *   Body: { job_role_id, template_id, version?, notes? }
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore'];
const ALLOWED_READ = [...MC_ROLES, 'segreteria_mdl', 'datore_lavoro', 'rspp'];
const ALLOWED_WRITE = [...MC_ROLES, 'segreteria_mdl'];

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const companyId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  // DL/RSPP can only see their own company
  if (['datore_lavoro', 'rspp'].includes(ctx.user.role) && companyId !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { data: protocols, error } = await supabaseAdmin
    .from('mdl_protocols')
    .select(`
      id, protocol_name, version, effective_date, expiry_date, visit_periodicity, notes, is_active,
      mdl_job_roles(id, role_name, risk_level, risk_factors),
      mdl_protocol_exams(id, exam_code, exam_name, exam_category, periodicity, is_mandatory, applicable_visit_types, sort_order, notes)
    `)
    .eq('company_id', companyId)
    .eq('is_active', true)
    .order('protocol_name');

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  // Sort exams within each protocol by sort_order
  (protocols || []).forEach((p: any) => {
    if (p.mdl_protocol_exams) {
      p.mdl_protocol_exams.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
    }
  });

  return Response.json({ success: true, data: protocols || [] });
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
    if (!body.job_role_id || !body.template_id) {
      return Response.json({ success: false, error: 'job_role_id e template_id sono obbligatori' }, { status: 400 });
    }

    // La mansione deve appartenere all'azienda
    const { data: jobRole } = await supabaseAdmin
      .from('mdl_job_roles')
      .select('id, role_name, company_id')
      .eq('id', body.job_role_id)
      .eq('company_id', companyId)
      .maybeSingle();
    if (!jobRole) {
      return Response.json({ success: false, error: 'Mansione non trovata per questa azienda' }, { status: 404 });
    }

    // Carica il template (= protocollo sotto la sentinel company) e i suoi esami
    const TEMPLATE_COMPANY_ID = '00000000-0000-4000-a000-000000000001';
    const { data: template } = await supabaseAdmin
      .from('mdl_protocols')
      .select('id, protocol_name, visit_periodicity, notes, mdl_protocol_exams(*)')
      .eq('id', body.template_id)
      .eq('company_id', TEMPLATE_COMPANY_ID)
      .eq('is_active', true)
      .maybeSingle();
    if (!template) {
      return Response.json({ success: false, error: 'Template non trovato' }, { status: 404 });
    }

    const version = (body.version || '1.0').toString().trim();

    // Crea il protocollo aziendale
    const { data: protocol, error: pErr } = await supabaseAdmin
      .from('mdl_protocols')
      .insert({
        company_id: companyId,
        job_role_id: body.job_role_id,
        protocol_name: body.protocol_name?.trim() || template.protocol_name,
        version,
        visit_periodicity: template.visit_periodicity,
        notes: body.notes || template.notes || null,
        created_by: ctx.user.id,
      })
      .select()
      .single();

    if (pErr) {
      // 23505 = unique_violation (company_id, job_role_id, version)
      if ((pErr as any).code === '23505') {
        return Response.json({ success: false, error: 'Esiste già un protocollo con questa versione per la mansione' }, { status: 409 });
      }
      return Response.json({ success: false, error: pErr.message }, { status: 500 });
    }

    // Clona gli esami del template
    const tplExams = template.mdl_protocol_exams || [];
    if (tplExams.length > 0) {
      const examRows = tplExams.map((e: any) => ({
        protocol_id: protocol.id,
        exam_code: e.exam_code,
        exam_name: e.exam_name,
        exam_category: e.exam_category,
        periodicity: e.periodicity,
        is_mandatory: e.is_mandatory,
        applicable_visit_types: e.applicable_visit_types,
        notes: e.notes,
        sort_order: e.sort_order,
      }));
      const { error: exErr } = await supabaseAdmin.from('mdl_protocol_exams').insert(examRows);
      if (exErr) {
        // rollback "best effort": elimina il protocollo creato
        await supabaseAdmin.from('mdl_protocols').delete().eq('id', protocol.id);
        return Response.json({ success: false, error: 'Errore copia esami: ' + exErr.message }, { status: 500 });
      }
    }

    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'protocol_create',
      target_type: 'protocol',
      target_id: protocol.id,
      company_id: companyId,
      ip_address: ctx.ip,
      details: { template_id: body.template_id, job_role_id: body.job_role_id, exams: tplExams.length },
    });

    return Response.json({ success: true, data: { protocol, exams_created: tplExams.length } }, { status: 201 });
  } catch (err: any) {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

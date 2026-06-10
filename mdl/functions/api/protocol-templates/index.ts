/**
 * GET  /api/protocol-templates — Catalogo dei protocolli sanitari standard
 * POST /api/protocol-templates — Crea un nuovo modello (con esami)
 *
 * Uses the existing mdl_protocols + mdl_protocol_exams tables.
 * Templates are protocols where company_id = TEMPLATE_COMPANY_ID (sentinel).
 */

const TEMPLATE_COMPANY_ID = '00000000-0000-4000-a000-000000000001';
const READ_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl'];
const WRITE_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore'];
const PERIODICITY = ['semestrale', 'annuale', 'biennale', 'triennale', 'quinquennale', 'una_tantum'];

function slugify(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 55) || 'modello';
}

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

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !READ_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;

  // Fetch protocols that belong to the template sentinel company
  const { data: protocols, error } = await supabaseAdmin
    .from('mdl_protocols')
    .select(`
      id, protocol_name, visit_periodicity, notes, is_active, created_at,
      job_role_id,
      mdl_protocol_exams(id, exam_code, exam_name, exam_category, periodicity, is_mandatory, applicable_visit_types, sort_order, notes)
    `)
    .eq('company_id', TEMPLATE_COMPANY_ID)
    .eq('is_active', true)
    .order('protocol_name');

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  // Fetch corresponding job roles to get risk_factors and description
  const jobRoleIds = (protocols || []).map((p: any) => p.job_role_id).filter(Boolean);
  let jobRolesMap: Record<string, any> = {};
  if (jobRoleIds.length > 0) {
    const { data: roles } = await supabaseAdmin
      .from('mdl_job_roles')
      .select('id, role_name, description, risk_factors, risk_level')
      .in('id', jobRoleIds);
    if (roles) {
      roles.forEach((r: any) => { jobRolesMap[r.id] = r; });
    }
  }

  // Transform to the format expected by the frontend (matching the old template schema)
  const templates = (protocols || []).map((p: any) => {
    const role = jobRolesMap[p.job_role_id] || {};
    const exams = p.mdl_protocol_exams || [];
    exams.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

    // Extract legal reference from notes (format: "... Rif. D.Lgs. ...")
    const notesText = p.notes || '';
    const legalMatch = notesText.match(/Rif\.\s*(.+)$/);
    const legalReference = legalMatch ? legalMatch[1].trim() : '';
    const description = legalMatch ? notesText.replace(/\s*Rif\.\s*.+$/, '').trim() : notesText;

    return {
      id: p.id,
      code: slugify(p.protocol_name),
      name: p.protocol_name,
      description: description || role.description || '',
      risk_factors: role.risk_factors || [],
      visit_periodicity: p.visit_periodicity,
      legal_reference: legalReference,
      is_active: p.is_active,
      created_at: p.created_at,
      // Nested exams — use the same key the frontend expects
      mdl_protocol_template_exams: exams.map((e: any) => ({
        id: e.id,
        exam_code: e.exam_code,
        exam_name: e.exam_name,
        exam_category: e.exam_category,
        periodicity: e.periodicity,
        is_mandatory: e.is_mandatory,
        applicable_visit_types: e.applicable_visit_types,
        sort_order: e.sort_order,
        notes: e.notes,
      })),
    };
  });

  return Response.json({ success: true, data: templates });
};

export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !WRITE_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  try {
    const body = await context.request.json() as any;
    if (!body.name) {
      return Response.json({ success: false, error: 'Nome del modello obbligatorio' }, { status: 400 });
    }

    const visitPeriodicity = PERIODICITY.includes(body.visit_periodicity) ? body.visit_periodicity : 'annuale';
    const riskFactors = Array.isArray(body.risk_factors)
      ? body.risk_factors
      : (typeof body.risk_factors === 'string' ? body.risk_factors.split(',').map((s: string) => s.trim()).filter(Boolean) : []);

    // Build notes from description + legal_reference
    let notes = body.description || '';
    if (body.legal_reference) {
      notes = notes ? `${notes} Rif. ${body.legal_reference}` : `Rif. ${body.legal_reference}`;
    }

    // 1. Create a job role under the template company
    const { data: role, error: roleErr } = await supabaseAdmin
      .from('mdl_job_roles')
      .insert({
        company_id: TEMPLATE_COMPANY_ID,
        role_name: String(body.name).trim(),
        description: body.description || null,
        risk_factors: riskFactors,
        risk_level: 'medio',
        is_active: true,
      })
      .select()
      .single();

    if (roleErr) {
      return Response.json({ success: false, error: 'Errore creazione mansione template: ' + roleErr.message }, { status: 500 });
    }

    // 2. Create protocol under the template company
    const { data: protocol, error: pErr } = await supabaseAdmin
      .from('mdl_protocols')
      .insert({
        company_id: TEMPLATE_COMPANY_ID,
        job_role_id: role.id,
        protocol_name: String(body.name).trim(),
        version: '1.0',
        visit_periodicity: visitPeriodicity,
        notes: notes || null,
        created_by: ctx.user.id,
        is_active: true,
      })
      .select()
      .single();

    if (pErr) {
      // Cleanup the role if protocol creation failed
      await supabaseAdmin.from('mdl_job_roles').delete().eq('id', role.id);
      if ((pErr as any).code === '23505') {
        return Response.json({ success: false, error: 'Esiste già un modello con questo nome' }, { status: 409 });
      }
      return Response.json({ success: false, error: pErr.message }, { status: 500 });
    }

    // 3. Insert exams
    const exams = normalizeExams(body.exams).map((e) => ({ ...e, protocol_id: protocol.id }));
    if (exams.length > 0) {
      const { error: exErr } = await supabaseAdmin.from('mdl_protocol_exams').insert(exams);
      if (exErr) {
        // Cleanup
        await supabaseAdmin.from('mdl_protocols').delete().eq('id', protocol.id);
        await supabaseAdmin.from('mdl_job_roles').delete().eq('id', role.id);
        return Response.json({ success: false, error: 'Errore salvataggio esami: ' + exErr.message }, { status: 500 });
      }
    }

    // 4. Audit log
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id, user_role: ctx.user.role,
      action: 'protocol_create', target_type: 'protocol_template', target_id: protocol.id,
      ip_address: ctx.ip, details: { name: protocol.protocol_name, exams: exams.length },
    }).catch(() => {}); // non-critical

    return Response.json({
      success: true,
      data: { template: { id: protocol.id, name: protocol.protocol_name }, exams_created: exams.length },
    }, { status: 201 });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

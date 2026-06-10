/**
 * POST /api/visits/:id/fitness-judgment — Issue fitness judgment for a visit
 * Only medico_competente and medico_collaboratore can issue judgments
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore'];

export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !MC_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Solo il Medico Competente puo emettere giudizi di idoneita' }, { status: 403 });
  }

  const visitId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  try {
    const body = await context.request.json() as any;

    // Validation
    if (!body.judgment_type) {
      return Response.json({ success: false, error: 'Tipo di giudizio obbligatorio' }, { status: 400 });
    }

    const validTypes = [
      'idoneo', 'idoneo_con_prescrizioni', 'idoneo_con_limitazioni_temporanee',
      'idoneo_con_limitazioni_permanenti', 'temporaneamente_non_idoneo', 'non_idoneo_permanente',
    ];
    if (!validTypes.includes(body.judgment_type)) {
      return Response.json({ success: false, error: 'Tipo di giudizio non valido' }, { status: 400 });
    }

    // Require prescriptions/limitations for relevant types
    if (body.judgment_type === 'idoneo_con_prescrizioni' && !body.prescriptions) {
      return Response.json({ success: false, error: 'Prescrizioni obbligatorie per questo giudizio' }, { status: 400 });
    }
    if (body.judgment_type.includes('limitazioni') && !body.limitations) {
      return Response.json({ success: false, error: 'Limitazioni obbligatorie per questo giudizio' }, { status: 400 });
    }
    if (body.judgment_type === 'temporaneamente_non_idoneo' && !body.reevaluation_date) {
      return Response.json({ success: false, error: 'Data di rivalutazione obbligatoria per non idoneita temporanea' }, { status: 400 });
    }

    // Get visit details
    const { data: visit } = await supabaseAdmin
      .from('mdl_visits')
      .select('id, worker_id, company_id, visit_type, status')
      .eq('id', visitId)
      .single();

    if (!visit) {
      return Response.json({ success: false, error: 'Visita non trovata' }, { status: 404 });
    }

    // Get worker's current job role
    const { data: currentJob } = await supabaseAdmin
      .from('mdl_worker_jobs')
      .select('job_role_id')
      .eq('worker_id', visit.worker_id)
      .eq('is_current', true)
      .maybeSingle();

    // Mark previous judgment as non-current
    await supabaseAdmin
      .from('mdl_fitness_judgments')
      .update({ is_current: false })
      .eq('worker_id', visit.worker_id)
      .eq('is_current', true);

    // Calculate next visit date from protocol periodicity
    let nextVisitDate: string | null = null;
    if (currentJob) {
      const { data: protocol } = await supabaseAdmin
        .from('mdl_protocols')
        .select('visit_periodicity')
        .eq('job_role_id', currentJob.job_role_id)
        .eq('is_active', true)
        .maybeSingle();

      if (protocol) {
        const today = new Date();
        const periodicityMonths: Record<string, number> = {
          'semestrale': 6, 'annuale': 12, 'biennale': 24,
          'triennale': 36, 'quinquennale': 60, 'una_tantum': 0,
        };
        const months = periodicityMonths[protocol.visit_periodicity] || 12;
        if (months > 0) {
          today.setMonth(today.getMonth() + months);
          nextVisitDate = today.toISOString().slice(0, 10);
        }
      }
    }

    const issuedDate = body.issued_date || new Date().toISOString().slice(0, 10);

    const judgmentData = {
      visit_id: visitId,
      worker_id: visit.worker_id,
      company_id: visit.company_id,
      job_role_id: currentJob?.job_role_id || null,
      judgment_type: body.judgment_type,
      prescriptions: body.prescriptions || null,
      limitations: body.limitations || null,
      limitations_start: body.limitations_start || issuedDate,
      limitations_expiry: body.limitations_expiry || null,
      reevaluation_date: body.reevaluation_date || null,
      clinical_motivation: body.clinical_motivation || null, // SOLO MC vede
      next_visit_date: body.next_visit_date || nextVisitDate,
      next_visit_type: body.next_visit_type || 'periodica',
      issued_date: issuedDate,
      physician_id: ctx.user.id,
      is_current: true,
    };

    const { data: judgment, error } = await supabaseAdmin
      .from('mdl_fitness_judgments')
      .insert(judgmentData)
      .select()
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    // Update visit status to completata
    await supabaseAdmin
      .from('mdl_visits')
      .update({ status: 'completata', actual_date: issuedDate })
      .eq('id', visitId);

    // Audit (high risk — clinical decision)
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'fitness_issue',
      target_type: 'fitness_judgment',
      target_id: judgment.id,
      company_id: visit.company_id,
      ip_address: ctx.ip,
      risk_level: 'high',
      details: {
        worker_id: visit.worker_id,
        judgment_type: body.judgment_type,
        has_limitations: !!body.limitations,
        next_visit: nextVisitDate,
      },
    });

    return Response.json({ success: true, data: judgment }, { status: 201 });
  } catch (err: any) {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

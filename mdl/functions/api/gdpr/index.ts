/**
 * GDPR Compliance API — /api/gdpr
 *
 * GET  /api/gdpr/export?worker_id=UUID
 *   Returns all personal data for a worker (portability right, Art. 20 GDPR).
 *   Includes: worker profile, visits, fitness judgments, documents, training records.
 *
 * POST /api/gdpr/anonymize
 *   Body: { worker_id, reason }
 *   Anonymizes a worker's personal data (right to erasure, Art. 17 GDPR).
 *   Note: clinical records required by D.Lgs. 81/2008 art. 25 comma 1 lettera c)
 *   must be retained for 40 years. Anonymization replaces PII but keeps structure.
 *
 * GET /api/gdpr/consent-log?worker_id=UUID
 *   Returns consent/processing activity log for a worker.
 *
 * Roles:
 *   SA/MC: full access (data controller / processor)
 *   segreteria: export only (no anonymization)
 *   DL: export only for own company workers
 */

const FULL_ACCESS_ROLES = ['super_admin', 'medico_competente'];
const EXPORT_ROLES = [...FULL_ACCESS_ROLES, 'segreteria_mdl', 'datore_lavoro'];
const ANONYMIZE_ROLES = FULL_ACCESS_ROLES;

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !EXPORT_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const url = new URL(context.request.url);
  const workerId = url.searchParams.get('worker_id');
  const action = url.searchParams.get('action') || 'export';

  if (!workerId) {
    return Response.json({ success: false, error: 'worker_id obbligatorio' }, { status: 400 });
  }

  // Get worker
  const { data: worker, error: wErr } = await supabaseAdmin
    .from('mdl_workers')
    .select('*')
    .eq('id', workerId)
    .maybeSingle();

  if (wErr || !worker) {
    return Response.json({ success: false, error: 'Lavoratore non trovato' }, { status: 404 });
  }

  // DL: can only access own company workers
  if (ctx.user.role === 'datore_lavoro' && worker.company_id !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  if (action === 'consent-log') {
    // Return audit log entries related to this worker
    const { data: logs } = await supabaseAdmin
      .from('mdl_audit_log')
      .select('*')
      .eq('target_id', workerId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Audit the access
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id, user_role: ctx.user.role,
      action: 'gdpr_consent_log', target_type: 'worker', target_id: workerId,
      company_id: worker.company_id, ip_address: ctx.ip,
      risk_level: 'high',
    });

    return Response.json({ success: true, data: { worker_id: workerId, logs: logs || [] } });
  }

  // ── Export: gather all data ──────────────────────────────────────────
  const { data: visits } = await supabaseAdmin
    .from('mdl_visits')
    .select('id, visit_type, scheduled_date, scheduled_time, actual_date, status, location, notes, created_at')
    .eq('worker_id', workerId)
    .order('scheduled_date', { ascending: false });

  const { data: fitnesses } = await supabaseAdmin
    .from('mdl_fitness_judgments')
    .select('id, judgment_type, judgment_date, prescriptions, limitations, next_visit_date, next_visit_type, is_current, created_at')
    .eq('worker_id', workerId)
    .order('judgment_date', { ascending: false });

  const { data: visitExams } = await supabaseAdmin
    .from('mdl_visit_exams')
    .select('id, visit_id, exam_code, exam_name, exam_date, result_text, result_value, result_unit, is_normal, is_abnormal, created_at')
    .in('visit_id', (visits || []).map((v: any) => v.id));

  const { data: training } = await supabaseAdmin
    .from('mdl_training_records')
    .select('id, course_name, training_type, completion_date, expiry_date, certificate_number, notes, created_at')
    .eq('worker_id', workerId)
    .order('completion_date', { ascending: false });

  const { data: workerJobs } = await supabaseAdmin
    .from('mdl_worker_jobs')
    .select('id, job_role_id, start_date, end_date, is_current, mdl_job_roles(role_name)')
    .eq('worker_id', workerId);

  // Audit the export
  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id, user_role: ctx.user.role,
    action: 'gdpr_export', target_type: 'worker', target_id: workerId,
    company_id: worker.company_id, ip_address: ctx.ip,
    risk_level: 'high',
    details: {
      visits: (visits || []).length,
      fitnesses: (fitnesses || []).length,
      exams: (visitExams || []).length,
      training: (training || []).length,
    },
  });

  // Non-clinical roles: strip clinical data
  const isClinical = FULL_ACCESS_ROLES.includes(ctx.user.role);
  const safeVisits = (visits || []).map((v: any) => {
    if (isClinical) return v;
    const { notes, ...safe } = v;
    return safe;
  });

  return Response.json({
    success: true,
    data: {
      export_date: new Date().toISOString(),
      data_controller: 'Bio-Clinic S.r.l. — Medicina del Lavoro',
      legal_basis: 'D.Lgs. 81/2008, GDPR Art. 6(1)(c), Art. 9(2)(h)',
      worker: {
        ...worker,
        ...(isClinical ? {} : { is_pregnant: undefined, is_disabled: undefined, is_minor: undefined, notes: undefined }),
      },
      job_roles: workerJobs || [],
      visits: safeVisits,
      visit_exams: isClinical ? (visitExams || []) : [],
      fitness_judgments: fitnesses || [],
      training_records: training || [],
    },
  });
};

export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ANONYMIZE_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato — solo MC/SA possono anonimizzare' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;

  try {
    const body = await context.request.json() as any;
    const { worker_id, reason } = body;

    if (!worker_id || !reason) {
      return Response.json({ success: false, error: 'worker_id e reason obbligatori' }, { status: 400 });
    }

    // Get worker
    const { data: worker } = await supabaseAdmin
      .from('mdl_workers')
      .select('id, company_id, first_name, last_name, fiscal_code')
      .eq('id', worker_id)
      .maybeSingle();

    if (!worker) {
      return Response.json({ success: false, error: 'Lavoratore non trovato' }, { status: 404 });
    }

    // Anonymize personal data fields
    const anonymized = {
      first_name: 'ANONIMO',
      last_name: 'ANONIMIZZATO',
      fiscal_code: 'ANON' + worker_id.slice(0, 12).toUpperCase(),
      date_of_birth: null,
      place_of_birth: null,
      address_street: null,
      address_city: null,
      address_province: null,
      address_zip: null,
      phone: null,
      email: null,
      is_active: false,
      notes: 'GDPR Art. 17 — dati anonimizzati il ' + new Date().toISOString().slice(0, 10),
    };

    const { error: upErr } = await supabaseAdmin
      .from('mdl_workers')
      .update(anonymized)
      .eq('id', worker_id);

    if (upErr) {
      return Response.json({ success: false, error: upErr.message }, { status: 500 });
    }

    // Anonymize training records personal notes
    await supabaseAdmin
      .from('mdl_training_records')
      .update({ notes: null })
      .eq('worker_id', worker_id);

    // Audit with high risk
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id, user_role: ctx.user.role,
      action: 'gdpr_anonymize', target_type: 'worker', target_id: worker_id,
      company_id: worker.company_id, ip_address: ctx.ip,
      risk_level: 'critical',
      details: {
        reason,
        original_name: `${worker.first_name} ${worker.last_name}`,
        original_cf: worker.fiscal_code,
        note: 'Dati clinici (visite, idoneità, esami) mantenuti come da D.Lgs. 81/2008 art. 25 co. 1 lett. c) — conservazione 40 anni',
      },
    });

    return Response.json({
      success: true,
      data: {
        worker_id,
        anonymized: true,
        message: 'Dati personali anonimizzati. I dati clinici sono mantenuti per obbligo di legge (D.Lgs. 81/2008).',
        retained: ['mdl_visits', 'mdl_fitness_judgments', 'mdl_visit_exams'],
        removed: ['personal_data', 'contact_info', 'address'],
      },
    });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

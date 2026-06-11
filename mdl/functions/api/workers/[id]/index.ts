/**
 * GET /api/workers/:id — Full worker detail
 *   Returns: profile + company + current job role + protocol exams + visit exams (referti) + fitness judgments + visits
 * PATCH /api/workers/:id — Update worker
 * DELETE /api/workers/:id — Delete worker (hard delete)
 *
 * PHASE 0 SECURITY FIX:
 *   - BUG #2: select('*') exposed is_pregnant, is_disabled, is_minor to DL/RSPP
 *   - Worker sensitive fields stripped for non-clinical roles
 *   - Visit exams (referti) hidden for non-clinical roles
 *   - Fitness judgment clinical_motivation hidden for non-clinical roles
 *   - Visit notes hidden for DL/RSPP (may contain clinical info)
 *   - PATCH: segreteria cannot write sensitive worker flags
 *   - PATCH: segreteria blocked if worker is_validated = true
 *   - DELETE: segreteria can only delete non-validated workers
 *   - Uses centralised permissions module
 */

import {
  ALL_INTERNAL_ROLES,
  canViewClinicalData,
  canViewSensitiveWorkerData,
  isCompanyBoundRole,
  isLavoratore,
  stripSensitiveWorkerFields,
  stripFitnessJudgmentClinicalFields,
  CLINICAL_WORKER_WRITE_FIELDS,
  SEGRETERIA_WORKER_WRITE_FIELDS,
  WORKER_SAFE_SELECT,
} from '../../lib/permissions';

const ALLOWED_READ = [...ALL_INTERNAL_ROLES];
const ALLOWED_WRITE = ['super_admin', 'medico_competente', 'segreteria_mdl'];

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const workerId = (context.params as any).id;
  const { supabaseAdmin } = ctx;
  const role = ctx.user.role;

  const isClinical = canViewClinicalData(role);
  const canSeeSensitive = canViewSensitiveWorkerData(role);

  // ── 1. Worker profile ──────────────────────────────────────────────────
  // FIX BUG #2: Use explicit field list for non-clinical roles
  const workerSelect = canSeeSensitive
    ? `*, mdl_companies(id, business_name, vat_number, risk_level, sector),
       mdl_worker_jobs(id, job_role_id, is_current, start_date, end_date, department,
         mdl_job_roles(id, role_name, risk_level, risk_factors, is_active)
       )`
    : `${WORKER_SAFE_SELECT}, mdl_companies(id, business_name, vat_number, risk_level, sector),
       mdl_worker_jobs(id, job_role_id, is_current, start_date, end_date, department,
         mdl_job_roles(id, role_name, risk_level, risk_factors, is_active)
       )`;

  const { data: worker, error: wErr } = await supabaseAdmin
    .from('mdl_workers')
    .select(workerSelect)
    .eq('id', workerId)
    .single();

  if (wErr || !worker) {
    return Response.json({ success: false, error: 'Lavoratore non trovato' }, { status: 404 });
  }

  // DL/RSPP/lavoratore can only see their own company workers
  if (isCompanyBoundRole(role) && worker.company_id !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  // Lavoratore: can only see their own worker profile (match by fiscal_code or auth_id)
  if (isLavoratore(role)) {
    // Lavoratore's mdl_users record has fiscal_code; match against worker's fiscal_code
    const { data: lavoratoreProfile } = await supabaseAdmin
      .from('mdl_users')
      .select('fiscal_code')
      .eq('id', ctx.user.id)
      .single();
    if (!lavoratoreProfile?.fiscal_code || worker.fiscal_code !== lavoratoreProfile.fiscal_code) {
      return Response.json({ success: false, error: 'Non autorizzato — accesso solo al proprio profilo' }, { status: 403 });
    }
  }

  // Extra safety: strip sensitive fields if they somehow leaked through select
  if (!canSeeSensitive) {
    stripSensitiveWorkerFields(worker);
  }

  // ── 2. Current job role → protocol → protocol exams ────────────────────
  const currentJob = (worker.mdl_worker_jobs || []).find((j: any) => j.is_current);
  let protocolExams: any[] = [];
  let protocol: any = null;

  if (currentJob) {
    const { data: proto } = await supabaseAdmin
      .from('mdl_protocols')
      .select('id, protocol_name, version, visit_periodicity, is_active')
      .eq('job_role_id', currentJob.job_role_id)
      .eq('is_active', true)
      .maybeSingle();

    if (proto) {
      protocol = proto;
      const { data: exams } = await supabaseAdmin
        .from('mdl_protocol_exams')
        .select('*')
        .eq('protocol_id', proto.id)
        .order('sort_order');
      protocolExams = exams || [];
    }
  }

  // ── 3. Visits for this worker ──────────────────────────────────────────
  // DL/RSPP/segreteria: hide notes (may contain clinical info)
  const visitSelectFields = isClinical
    ? 'id, visit_type, status, scheduled_date, scheduled_time, actual_date, location, notes, created_at'
    : 'id, visit_type, status, scheduled_date, scheduled_time, actual_date, location, created_at';

  const { data: visits } = await supabaseAdmin
    .from('mdl_visits')
    .select(visitSelectFields)
    .eq('worker_id', workerId)
    .order('scheduled_date', { ascending: false });

  // ── 4. Visit exams (referti) — ONLY for clinical roles ─────────────────
  const visitIds = (visits || []).map((v: any) => v.id);
  let visitExams: any[] = [];
  if (isClinical && visitIds.length > 0) {
    const { data: exams } = await supabaseAdmin
      .from('mdl_visit_exams')
      .select('*, mdl_visits!inner(id, scheduled_date, visit_type)')
      .in('visit_id', visitIds)
      .order('exam_date', { ascending: false });
    visitExams = exams || [];
  }

  // ── 5. Fitness judgments ───────────────────────────────────────────────
  const { data: fitnessJudgments } = await supabaseAdmin
    .from('mdl_fitness_judgments')
    .select('*')
    .eq('worker_id', workerId)
    .order('issued_date', { ascending: false });

  // ── 6. Exam status map (protocol exams vs completed exams) ─────────────
  const latestCompletedVisit = (visits || []).find((v: any) => v.status === 'completata');
  const latestVisitExamCodes = new Set(
    visitExams
      .filter((e: any) => latestCompletedVisit && e.visit_id === latestCompletedVisit.id)
      .map((e: any) => e.exam_code)
  );

  const examStatus = protocolExams.map((pe: any) => ({
    ...pe,
    completed: latestVisitExamCodes.has(pe.exam_code),
    // Non-clinical roles don't see exam results
    latestResult: isClinical
      ? (visitExams.find((ve: any) => ve.exam_code === pe.exam_code) || null)
      : null,
  }));

  // ── 7. Sanitise fitness judgments for non-clinical roles ───────────────
  const sanitizedJudgments = isClinical
    ? (fitnessJudgments || [])
    : (fitnessJudgments || []).map(stripFitnessJudgmentClinicalFields);

  const currentFitness = (fitnessJudgments || []).find((f: any) => f.is_current) || null;
  const sanitizedCurrentFitness = isClinical
    ? currentFitness
    : stripFitnessJudgmentClinicalFields(currentFitness);

  return Response.json({
    success: true,
    data: {
      worker,
      protocol,
      protocolExams: examStatus,
      visitExams: isClinical ? visitExams : [],
      fitnessJudgments: sanitizedJudgments,
      currentFitness: sanitizedCurrentFitness,
      visits: visits || [],
    },
  });
};

export const onRequestPatch: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const workerId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  try {
    const body = await context.request.json() as any;
    const isMC = canViewClinicalData(ctx.user.role);
    const isSegreteria = ctx.user.role === 'segreteria_mdl';

    // ── Segreteria: check is_validated before allowing edit ────────────
    if (isSegreteria) {
      const { data: existing } = await supabaseAdmin
        .from('mdl_workers')
        .select('is_validated')
        .eq('id', workerId)
        .single();

      if (existing?.is_validated) {
        return Response.json({
          success: false,
          error: 'Lavoratore validato — solo il Medico Competente può modificare i dati'
        }, { status: 403 });
      }
    }

    // ── Role-based field restrictions ────────────────────────────────────
    // Segreteria CANNOT write sensitive flags (is_pregnant, is_disabled, is_minor)
    // MC/admin can also set is_validated
    const allowedFields = isMC
      ? [...CLINICAL_WORKER_WRITE_FIELDS, 'is_validated']
      : SEGRETERIA_WORKER_WRITE_FIELDS;

    const patch: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    if (Object.keys(patch).length === 0) {
      return Response.json({ success: false, error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('mdl_workers')
      .update(patch)
      .eq('id', workerId)
      .select()
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'worker_update',
      target_type: 'worker',
      target_id: workerId,
      company_id: data.company_id,
      ip_address: ctx.ip,
      details: { updated_fields: Object.keys(patch) },
    });

    return Response.json({ success: true, data });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE /api/workers/:id — Hard delete worker
//   - super_admin / medico_competente: can always delete
//   - segreteria_mdl: can delete ONLY if is_validated = false
// ═══════════════════════════════════════════════════════════════════════════════

export const onRequestDelete: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const workerId = (context.params as any).id;
  const { supabaseAdmin } = ctx;
  const isSegreteria = ctx.user.role === 'segreteria_mdl';

  try {
    // Fetch worker to check is_validated and company scope
    const { data: worker, error: fetchErr } = await supabaseAdmin
      .from('mdl_workers')
      .select('id, company_id, is_validated, first_name, last_name, fiscal_code')
      .eq('id', workerId)
      .single();

    if (fetchErr || !worker) {
      return Response.json({ success: false, error: 'Lavoratore non trovato' }, { status: 404 });
    }

    // Segreteria: can only delete non-validated workers
    if (isSegreteria && worker.is_validated) {
      return Response.json({
        success: false,
        error: 'Impossibile eliminare: il lavoratore è stato validato dal Medico Competente'
      }, { status: 403 });
    }

    // DL/RSPP scoped check (if they were in ALLOWED_WRITE in future)
    if (isCompanyBoundRole(ctx.user.role) && worker.company_id !== ctx.user.company_id) {
      return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
    }

    // Hard delete — cascades to worker_jobs, training_records, etc.
    const { error: delErr } = await supabaseAdmin
      .from('mdl_workers')
      .delete()
      .eq('id', workerId);

    if (delErr) {
      return Response.json({ success: false, error: delErr.message }, { status: 500 });
    }

    // Audit log
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'worker_delete',
      target_type: 'worker',
      target_id: workerId,
      company_id: worker.company_id,
      ip_address: ctx.ip,
      details: {
        deleted_worker: `${worker.last_name} ${worker.first_name}`,
        fiscal_code: worker.fiscal_code,
        was_validated: worker.is_validated,
      },
    });

    return Response.json({ success: true, message: 'Lavoratore eliminato' });
  } catch {
    return Response.json({ success: false, error: 'Errore durante l\'eliminazione' }, { status: 500 });
  }
};

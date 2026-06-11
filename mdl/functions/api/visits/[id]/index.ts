/**
 * GET  /api/visits/:id — Full visit detail
 *   Returns: visit + worker + company + visit_exams + fitness_judgment + protocol
 * PATCH /api/visits/:id — Update visit (status, clinical data, notes)
 *
 * PHASE 0 SECURITY FIX:
 *   - segreteria_mdl REMOVED from isClinical (was BUG #1)
 *   - segreteria_mdl restricted to scheduling fields only on PATCH
 *   - segreteria_mdl cannot set status to 'completata' or 'in_corso'
 *   - DL/RSPP: no clinical data, no visit_exams, no clinical_motivation
 *   - Uses centralised permissions module
 */

import {
  CLINICAL_ROLES,
  ALL_INTERNAL_ROLES,
  ADMIN_ROLES,
  canViewClinicalData,
  stripClinicalVisitFields,
  stripFitnessJudgmentClinicalFields,
  SEGRETERIA_VISIT_WRITE_FIELDS,
  SEGRETERIA_ALLOWED_STATUSES,
} from '../../lib/permissions';

const ALLOWED_READ = [...ALL_INTERNAL_ROLES];  // Now includes 'lavoratore'
const ALLOWED_WRITE = [...ADMIN_ROLES];

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const visitId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  // ── FIX BUG #1: isClinical = ONLY CLINICAL_ROLES ──────────────────────
  // segreteria_mdl was incorrectly included here before.
  // D.Lgs. 81/2008 art. 25 + GDPR art. 9: only physicians see clinical data.
  const isClinical = canViewClinicalData(ctx.user.role);

  // 1. Visit with worker + company
  const { data: visit, error: vErr } = await supabaseAdmin
    .from('mdl_visits')
    .select(`
      *,
      mdl_workers!inner(id, first_name, last_name, fiscal_code, date_of_birth, gender, company_id,
        mdl_companies(id, business_name),
        mdl_worker_jobs(id, job_role_id, is_current,
          mdl_job_roles(id, role_name, risk_level)
        )
      )
    `)
    .eq('id', visitId)
    .single();

  if (vErr || !visit) {
    return Response.json({ success: false, error: 'Visita non trovata' }, { status: 404 });
  }

  // DL/RSPP/lavoratore can only see their own company
  if (['datore_lavoro', 'rspp', 'lavoratore'].includes(ctx.user.role) && visit.company_id !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  // Lavoratore: self-only — can only see visits for their own worker record
  if (ctx.user.role === 'lavoratore') {
    const { data: lavoratoreProfile } = await supabaseAdmin
      .from('mdl_users')
      .select('fiscal_code')
      .eq('id', ctx.user.id)
      .single();
    const workerFC = visit.mdl_workers?.fiscal_code;
    if (!lavoratoreProfile?.fiscal_code || workerFC !== lavoratoreProfile.fiscal_code) {
      return Response.json({ success: false, error: 'Non autorizzato — accesso solo alle proprie visite' }, { status: 403 });
    }
  }

  // Strip clinical data for non-clinical roles (DL, RSPP, segreteria)
  if (!isClinical) {
    stripClinicalVisitFields(visit);
  }

  // 2. Visit exams (referti) — ONLY for clinical roles
  let safeVisitExams: any[] = [];
  if (isClinical) {
    const { data: visitExams } = await supabaseAdmin
      .from('mdl_visit_exams')
      .select('*')
      .eq('visit_id', visitId)
      .order('exam_code');
    safeVisitExams = visitExams || [];
  }

  // 3. Fitness judgment for this visit
  const { data: fitnessJudgment } = await supabaseAdmin
    .from('mdl_fitness_judgments')
    .select('*')
    .eq('visit_id', visitId)
    .maybeSingle();

  // Strip clinical motivation for non-clinical roles
  const safeFitnessJudgment = isClinical
    ? fitnessJudgment
    : stripFitnessJudgmentClinicalFields(fitnessJudgment);

  // 4. Protocol exams (expected exams) from worker's current job role
  const worker = visit.mdl_workers;
  const currentJob = (worker?.mdl_worker_jobs || []).find((j: any) => j.is_current);
  let protocolExams: any[] = [];
  let protocol: any = null;

  if (currentJob) {
    const { data: proto } = await supabaseAdmin
      .from('mdl_protocols')
      .select('id, protocol_name, version, visit_periodicity')
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

  // 5. Physician info
  let physician: any = null;
  if (visit.physician_id) {
    const { data: doc } = await supabaseAdmin
      .from('mdl_users')
      .select('id, first_name, last_name, role, email')
      .eq('id', visit.physician_id)
      .maybeSingle();
    physician = doc;
  }

  return Response.json({
    success: true,
    data: {
      visit,
      visitExams: safeVisitExams,
      fitnessJudgment: safeFitnessJudgment,
      protocol,
      protocolExams,
      physician,
    },
  });
};

export const onRequestPatch: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const visitId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  try {
    const body = await context.request.json() as any;

    // ── Role-based field restrictions ────────────────────────────────────
    const clinicalFields = [
      'anamnesis_family', 'anamnesis_physiological', 'anamnesis_pathological_remote',
      'anamnesis_pathological_recent', 'anamnesis_occupational', 'physical_examination',
      'height_cm', 'weight_kg', 'bmi', 'blood_pressure_systolic', 'blood_pressure_diastolic',
      'heart_rate', 'visual_acuity_right', 'visual_acuity_left', 'conclusions',
    ];
    const mcSchedulingFields = [
      'scheduled_date', 'scheduled_time', 'actual_date', 'status',
      'location', 'duration_minutes', 'notes',
    ];

    const isMC = canViewClinicalData(ctx.user.role);
    let allowedFields: string[];

    if (isMC) {
      // MC: all fields
      allowedFields = [...clinicalFields, ...mcSchedulingFields];
    } else {
      // Segreteria: restricted scheduling fields only (no notes, no clinical)
      allowedFields = [...SEGRETERIA_VISIT_WRITE_FIELDS];
    }

    const patch: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) patch[key] = body[key];
    }

    // ── Status transition validation ─────────────────────────────────────
    if (patch.status) {
      const validStatuses = ['programmata', 'confermata', 'in_corso', 'completata', 'non_presentato', 'annullata'];
      if (!validStatuses.includes(patch.status)) {
        return Response.json({ success: false, error: 'Stato non valido' }, { status: 400 });
      }

      // Segreteria cannot set clinical-completion statuses
      if (!isMC && !SEGRETERIA_ALLOWED_STATUSES.includes(patch.status)) {
        return Response.json({
          success: false,
          error: 'La segreteria non puo impostare lo stato "' + patch.status + '". Solo il Medico Competente puo completare una visita.',
        }, { status: 403 });
      }
    }

    // Auto-calculate BMI if both height and weight provided
    if (patch.height_cm && patch.weight_kg) {
      const h = parseFloat(patch.height_cm) / 100;
      patch.bmi = parseFloat((parseFloat(patch.weight_kg) / (h * h)).toFixed(1));
    }

    if (Object.keys(patch).length === 0) {
      return Response.json({ success: false, error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('mdl_visits')
      .update(patch)
      .eq('id', visitId)
      .select('*, mdl_workers!inner(id, first_name, last_name, company_id)')
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    // Audit
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'visit_update',
      target_type: 'visit',
      target_id: visitId,
      company_id: data.mdl_workers?.company_id || data.company_id,
      ip_address: ctx.ip,
      risk_level: patch.status === 'completata' ? 'medium' : 'low',
      details: { updated_fields: Object.keys(patch), status: patch.status },
    });

    return Response.json({ success: true, data });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

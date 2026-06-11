/**
 * GET  /api/training — List training records (filtered by worker, company, type, expiry)
 * POST /api/training — Create a new training record
 *
 * RBAC:
 *   - ADMIN_ROLES (SA, MC, segreteria): full access, all companies
 *   - DL/RSPP: read/write only for their own company workers
 *   - lavoratore: read own records only, no create
 *
 * COMPANY-SCOPED ISOLATION:
 *   - DL/RSPP: see only training for workers of their own company
 *   - lavoratore: see only their own training records
 */

import { ADMIN_ROLES, COMPANY_ROLES } from '../lib/permissions';

const ALLOWED_READ = [...ADMIN_ROLES, ...COMPANY_ROLES, 'lavoratore'];
const ALLOWED_WRITE = [...ADMIN_ROLES, ...COMPANY_ROLES];

const VALID_TRAINING_TYPES = [
  'generale_4h', 'specifica_basso_4h', 'specifica_medio_8h', 'specifica_alto_12h',
  'aggiornamento_6h', 'preposti_8h', 'dirigenti_16h', 'rls_32h', 'rls_aggiornamento',
  'primo_soccorso_16h', 'primo_soccorso_aggiornamento',
  'antincendio_livello1', 'antincendio_livello2', 'antincendio_livello3',
  'carrellisti', 'gru', 'ple', 'dpi_terza_categoria', 'spazi_confinati',
  'lavori_quota', 'rischio_elettrico', 'altro',
];

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const url = new URL(context.request.url);
  const workerId = url.searchParams.get('worker_id');
  const companyId = url.searchParams.get('company_id');
  const trainingType = url.searchParams.get('training_type');
  const expiring = url.searchParams.get('expiring'); // 'true' = only with expiry_date
  const expired = url.searchParams.get('expired'); // 'true' = only already expired
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('mdl_training_records')
    .select(
      '*, mdl_workers!inner(id, first_name, last_name, fiscal_code, company_id, is_active, mdl_companies(id, business_name))',
      { count: 'exact' }
    );

  // ── Company scope for DL/RSPP ────────────────────────────────────────
  if ([...COMPANY_ROLES].includes(ctx.user.role)) {
    query = query.eq('mdl_workers.company_id', ctx.user.company_id);
  } else if (companyId) {
    query = query.eq('mdl_workers.company_id', companyId);
  }

  // ── Lavoratore: self-only ────────────────────────────────────────────
  if (ctx.user.role === 'lavoratore') {
    const { data: lavoratoreProfile } = await supabaseAdmin
      .from('mdl_users')
      .select('fiscal_code')
      .eq('id', ctx.user.id)
      .single();
    if (lavoratoreProfile?.fiscal_code) {
      const { data: selfWorker } = await supabaseAdmin
        .from('mdl_workers')
        .select('id')
        .eq('fiscal_code', lavoratoreProfile.fiscal_code)
        .eq('company_id', ctx.user.company_id)
        .maybeSingle();
      if (selfWorker) {
        query = query.eq('worker_id', selfWorker.id);
      } else {
        return Response.json({ success: true, data: [], pagination: { page, limit, total: 0, total_pages: 0 } });
      }
    }
  }

  // ── Filters ──────────────────────────────────────────────────────────
  if (workerId) query = query.eq('worker_id', workerId);
  if (trainingType && VALID_TRAINING_TYPES.includes(trainingType)) {
    query = query.eq('training_type', trainingType);
  }
  if (expiring === 'true') {
    query = query.not('expiry_date', 'is', null);
  }
  if (expired === 'true') {
    const today = new Date().toISOString().slice(0, 10);
    query = query.lt('expiry_date', today);
  }

  // Only active workers by default
  query = query.eq('mdl_workers.is_active', true);

  query = query.order('completion_date', { ascending: false }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    data,
    pagination: { page, limit, total: count || 0, total_pages: Math.ceil((count || 0) / limit) },
  });
};

export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;

  try {
    const body = await context.request.json() as any;

    // ── Validation ───────────────────────────────────────────────────────
    if (!body.worker_id || !body.training_type || !body.course_name || !body.completion_date) {
      return Response.json({
        success: false,
        error: 'Campi obbligatori: worker_id, training_type, course_name, completion_date',
      }, { status: 400 });
    }

    if (!VALID_TRAINING_TYPES.includes(body.training_type)) {
      return Response.json({ success: false, error: 'training_type non valido' }, { status: 400 });
    }

    // Validate date formats
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.completion_date)) {
      return Response.json({ success: false, error: 'completion_date deve essere in formato YYYY-MM-DD' }, { status: 400 });
    }
    if (body.expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.expiry_date)) {
      return Response.json({ success: false, error: 'expiry_date deve essere in formato YYYY-MM-DD' }, { status: 400 });
    }

    // ── Verify worker exists and company scope ───────────────────────────
    const { data: worker } = await supabaseAdmin
      .from('mdl_workers')
      .select('id, company_id')
      .eq('id', body.worker_id)
      .single();

    if (!worker) {
      return Response.json({ success: false, error: 'Lavoratore non trovato' }, { status: 404 });
    }

    // DL/RSPP: can only add training for own company workers
    if ([...COMPANY_ROLES].includes(ctx.user.role) && worker.company_id !== ctx.user.company_id) {
      return Response.json({ success: false, error: 'Non autorizzato per questo lavoratore' }, { status: 403 });
    }

    // ── Insert ───────────────────────────────────────────────────────────
    const insertData: Record<string, any> = {
      worker_id: body.worker_id,
      training_type: body.training_type,
      course_name: body.course_name.trim().slice(0, 300),
      completion_date: body.completion_date,
    };

    // Optional fields
    if (body.provider) insertData.provider = body.provider.trim().slice(0, 200);
    if (body.duration_hours != null) insertData.duration_hours = Math.min(parseFloat(body.duration_hours) || 0, 999.9);
    if (body.expiry_date) insertData.expiry_date = body.expiry_date;
    if (body.certificate_number) insertData.certificate_number = body.certificate_number.trim().slice(0, 100);
    if (body.certificate_path) insertData.certificate_path = body.certificate_path;
    if (body.notes) insertData.notes = body.notes.trim();

    const { data, error } = await supabaseAdmin
      .from('mdl_training_records')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    // ── Audit ────────────────────────────────────────────────────────────
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'training_create',
      target_type: 'training_record',
      target_id: data.id,
      company_id: worker.company_id,
      ip_address: ctx.ip,
      details: {
        worker_id: body.worker_id,
        training_type: body.training_type,
        course_name: body.course_name,
        completion_date: body.completion_date,
      },
    });

    return Response.json({ success: true, data }, { status: 201 });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

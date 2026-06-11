/**
 * GET /api/visits — List visits (filtered by worker, company, status, date range)
 * POST /api/visits — Schedule or create a visit
 *
 * COMPANY-SCOPED ISOLATION:
 *   - DL/RSPP: see only visits for their own company (no clinical data)
 *   - lavoratore: see only their own visits (no clinical data)
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore'];
const ALLOWED_READ = [...MC_ROLES, 'segreteria_mdl', 'datore_lavoro', 'rspp', 'lavoratore'];
const ALLOWED_WRITE = [...MC_ROLES, 'segreteria_mdl'];

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const url = new URL(context.request.url);
  const workerId = url.searchParams.get('worker_id');
  const companyId = url.searchParams.get('company_id');
  const status = url.searchParams.get('status');
  const dateFrom = url.searchParams.get('date_from');
  const dateTo = url.searchParams.get('date_to');
  const upcoming = url.searchParams.get('upcoming') === 'true';
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '25'), 100);
  const offset = (page - 1) * limit;

  // Select fields based on role — DL/RSPP/lavoratore don't see clinical data
  const NON_CLINICAL_LIST_ROLES = ['datore_lavoro', 'rspp', 'lavoratore'];
  const selectFields = NON_CLINICAL_LIST_ROLES.includes(ctx.user.role)
    ? 'id, worker_id, company_id, visit_type, scheduled_date, scheduled_time, actual_date, status, physician_id, location, created_at'
    : '*';

  let query = supabaseAdmin
    .from('mdl_visits')
    .select(`${selectFields}, mdl_workers!inner(id, first_name, last_name, fiscal_code)`, { count: 'exact' });

  // Company scope for DL/RSPP/lavoratore
  if (['datore_lavoro', 'rspp', 'lavoratore'].includes(ctx.user.role)) {
    query = query.eq('company_id', ctx.user.company_id);
  } else if (companyId) {
    query = query.eq('company_id', companyId);
  }

  // Lavoratore: self-only — filter by worker linked to their fiscal_code
  if (ctx.user.role === 'lavoratore') {
    const { data: lavoratoreProfile } = await supabaseAdmin
      .from('mdl_users')
      .select('fiscal_code')
      .eq('id', ctx.user.id)
      .single();
    if (lavoratoreProfile?.fiscal_code) {
      // Find the worker record for this lavoratore
      const { data: selfWorker } = await supabaseAdmin
        .from('mdl_workers')
        .select('id')
        .eq('fiscal_code', lavoratoreProfile.fiscal_code)
        .eq('company_id', ctx.user.company_id)
        .maybeSingle();
      if (selfWorker) {
        query = query.eq('worker_id', selfWorker.id);
      } else {
        // No matching worker found — return empty
        return Response.json({ success: true, data: [], pagination: { page, limit, total: 0, total_pages: 0 } });
      }
    }
  }

  if (workerId) query = query.eq('worker_id', workerId);
  if (status) query = query.eq('status', status);
  if (dateFrom) query = query.gte('scheduled_date', dateFrom);
  if (dateTo) query = query.lte('scheduled_date', dateTo);

  if (upcoming) {
    const today = new Date().toISOString().slice(0, 10);
    query = query.gte('scheduled_date', today).in('status', ['programmata', 'confermata']);
  }

  query = query.order('scheduled_date', { ascending: true }).range(offset, offset + limit - 1);

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

    if (!body.worker_id || !body.visit_type) {
      return Response.json({ success: false, error: 'worker_id e visit_type sono obbligatori' }, { status: 400 });
    }

    // Get worker to determine company
    const { data: worker } = await supabaseAdmin
      .from('mdl_workers')
      .select('id, company_id')
      .eq('id', body.worker_id)
      .single();

    if (!worker) {
      return Response.json({ success: false, error: 'Lavoratore non trovato' }, { status: 404 });
    }

    // Get current protocol for worker's job role
    let protocolId = body.protocol_id || null;
    if (!protocolId) {
      const { data: currentJob } = await supabaseAdmin
        .from('mdl_worker_jobs')
        .select('job_role_id')
        .eq('worker_id', body.worker_id)
        .eq('is_current', true)
        .maybeSingle();

      if (currentJob) {
        const { data: protocol } = await supabaseAdmin
          .from('mdl_protocols')
          .select('id')
          .eq('job_role_id', currentJob.job_role_id)
          .eq('is_active', true)
          .order('effective_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (protocol) protocolId = protocol.id;
      }
    }

    const insertData = {
      worker_id: body.worker_id,
      company_id: worker.company_id,
      visit_type: body.visit_type,
      protocol_id: protocolId,
      scheduled_date: body.scheduled_date || null,
      scheduled_time: body.scheduled_time || null,
      status: body.scheduled_date ? 'programmata' : 'in_corso',
      physician_id: body.physician_id || ctx.user.id,
      location: body.location || null,
      notes: body.notes || null,
    };

    const { data, error } = await supabaseAdmin
      .from('mdl_visits')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    // Audit
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'visit_schedule',
      target_type: 'visit',
      target_id: data.id,
      company_id: worker.company_id,
      ip_address: ctx.ip,
      details: { worker_id: body.worker_id, visit_type: body.visit_type, date: body.scheduled_date },
    });

    return Response.json({ success: true, data }, { status: 201 });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

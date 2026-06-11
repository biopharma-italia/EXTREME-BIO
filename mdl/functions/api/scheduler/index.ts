/**
 * Scheduler API — /api/scheduler
 *
 * GET  /api/scheduler?company_id=&horizon=30
 *   Returns workers needing scheduled visits (expired or expiring soon),
 *   with suggested dates based on protocol periodicity.
 *
 * POST /api/scheduler   (batch scheduling)
 *   Body: { items: [{ worker_id, visit_type, scheduled_date, scheduled_time?, location? }] }
 *   Batch-creates visits for multiple workers at once.
 *
 * Roles:
 *   SA/MC/collaboratore/segreteria: full access
 *   DL/RSPP: GET only, scoped to own company
 *   lavoratore: forbidden
 */

const ADMIN_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl'];
const READ_ROLES = [...ADMIN_ROLES, 'datore_lavoro', 'rspp'];
const WRITE_ROLES = [...ADMIN_ROLES];

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setUTCHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

const PERIOD_DAYS: Record<string, number> = {
  semestrale: 182,
  annuale: 365,
  biennale: 730,
  triennale: 1095,
  quinquennale: 1825,
  una_tantum: 0,
};

// ─── GET: list workers needing scheduling ────────────────────────────────────
export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !READ_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const url = new URL(context.request.url);
  let companyId = url.searchParams.get('company_id');
  const horizon = Math.min(parseInt(url.searchParams.get('horizon') || '30'), 365);

  // DL/RSPP: force own company
  if (['datore_lavoro', 'rspp'].includes(ctx.user.role)) {
    companyId = ctx.user.company_id;
  }

  // Get current fitness judgments with next_visit_date
  let fq = supabaseAdmin
    .from('mdl_fitness_judgments')
    .select(`
      id, next_visit_date, next_visit_type, judgment_type, worker_id, company_id,
      mdl_workers!inner(id, first_name, last_name, fiscal_code, is_active, company_id),
      mdl_companies(business_name)
    `)
    .eq('is_current', true)
    .eq('mdl_workers.is_active', true)
    .not('next_visit_date', 'is', null);
  if (companyId) fq = fq.eq('company_id', companyId);
  const { data: fitnesses } = await fq;

  const today = new Date().toISOString().slice(0, 10);
  const items: any[] = [];

  (fitnesses || []).forEach((f: any) => {
    const days = daysUntil(f.next_visit_date);
    if (days === null || days > horizon) return;

    items.push({
      worker_id: f.worker_id,
      worker_name: `${f.mdl_workers?.last_name || ''} ${f.mdl_workers?.first_name || ''}`.trim(),
      fiscal_code: f.mdl_workers?.fiscal_code || null,
      company_id: f.company_id,
      company_name: f.mdl_companies?.business_name || null,
      next_visit_date: f.next_visit_date,
      next_visit_type: f.next_visit_type || 'periodica',
      days_until: days,
      urgency: days < 0 ? 'scaduta' : days <= 7 ? 'critica' : days <= 30 ? 'urgente' : 'normale',
      suggested_date: f.next_visit_date, // use the protocol date as suggestion
      fitness_id: f.id,
    });
  });

  // Also include workers WITHOUT any fitness judgment (never visited)
  let noFitnessQuery = supabaseAdmin
    .from('mdl_workers')
    .select('id, first_name, last_name, fiscal_code, company_id, hire_date, mdl_companies(business_name)')
    .eq('is_active', true);
  if (companyId) noFitnessQuery = noFitnessQuery.eq('company_id', companyId);
  const { data: allWorkers } = await noFitnessQuery;

  const workersWithFitness = new Set((fitnesses || []).map((f: any) => f.worker_id));
  (allWorkers || []).forEach((w: any) => {
    if (workersWithFitness.has(w.id)) return;
    items.push({
      worker_id: w.id,
      worker_name: `${w.last_name || ''} ${w.first_name || ''}`.trim(),
      fiscal_code: w.fiscal_code || null,
      company_id: w.company_id,
      company_name: w.mdl_companies?.business_name || null,
      next_visit_date: null,
      next_visit_type: 'preventiva',
      days_until: null,
      urgency: 'mai_visitato',
      suggested_date: today,
      fitness_id: null,
    });
  });

  // Sort: overdue first, then by urgency
  const urgencyOrder: Record<string, number> = { scaduta: 0, critica: 1, urgente: 2, mai_visitato: 3, normale: 4 };
  items.sort((a, b) => (urgencyOrder[a.urgency] || 99) - (urgencyOrder[b.urgency] || 99) || (a.days_until || -9999) - (b.days_until || -9999));

  return Response.json({
    success: true,
    data: items,
    summary: {
      total: items.length,
      scadute: items.filter(i => i.urgency === 'scaduta').length,
      critiche: items.filter(i => i.urgency === 'critica').length,
      urgenti: items.filter(i => i.urgency === 'urgente').length,
      mai_visitati: items.filter(i => i.urgency === 'mai_visitato').length,
    },
  });
};

// ─── POST: batch schedule visits ─────────────────────────────────────────────
export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !WRITE_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;

  try {
    const body = await context.request.json() as any;
    const items = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return Response.json({ success: false, error: 'Fornire items: [{ worker_id, visit_type, scheduled_date }]' }, { status: 400 });
    }

    if (items.length > 50) {
      return Response.json({ success: false, error: 'Massimo 50 visite per batch' }, { status: 400 });
    }

    const results: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      if (!item.worker_id || !item.visit_type || !item.scheduled_date) {
        results.push({ worker_id: item.worker_id, success: false, error: 'Campi obbligatori mancanti' });
        errorCount++;
        continue;
      }

      // Get worker for company_id
      const { data: worker } = await supabaseAdmin
        .from('mdl_workers')
        .select('id, company_id')
        .eq('id', item.worker_id)
        .eq('is_active', true)
        .maybeSingle();

      if (!worker) {
        results.push({ worker_id: item.worker_id, success: false, error: 'Lavoratore non trovato' });
        errorCount++;
        continue;
      }

      // Check for duplicate: same worker + same date + same type + not cancelled
      const { data: existing } = await supabaseAdmin
        .from('mdl_visits')
        .select('id')
        .eq('worker_id', item.worker_id)
        .eq('scheduled_date', item.scheduled_date)
        .eq('visit_type', item.visit_type)
        .neq('status', 'annullata')
        .maybeSingle();

      if (existing) {
        results.push({ worker_id: item.worker_id, success: false, error: 'Visita già programmata per questa data' });
        errorCount++;
        continue;
      }

      const { data: visit, error: vErr } = await supabaseAdmin
        .from('mdl_visits')
        .insert({
          worker_id: item.worker_id,
          company_id: worker.company_id,
          visit_type: item.visit_type,
          scheduled_date: item.scheduled_date,
          scheduled_time: item.scheduled_time || null,
          location: item.location || null,
          status: 'programmata',
          physician_id: ctx.user.id,
        })
        .select('id')
        .single();

      if (vErr) {
        results.push({ worker_id: item.worker_id, success: false, error: vErr.message });
        errorCount++;
      } else {
        results.push({ worker_id: item.worker_id, success: true, visit_id: visit.id });
        successCount++;
      }
    }

    // Audit
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'scheduler_batch',
      target_type: 'visit',
      ip_address: ctx.ip,
      details: { total: items.length, success: successCount, errors: errorCount },
    });

    return Response.json({
      success: true,
      data: {
        results,
        summary: { total: items.length, success: successCount, errors: errorCount },
      },
    }, { status: 201 });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

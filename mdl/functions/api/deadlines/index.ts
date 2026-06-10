/**
 * GET /api/deadlines?company_id=&horizon=  — Scadenzario aggregato
 *   Aggrega: visite/idoneità (next_visit_date del giudizio corrente),
 *   documenti aziendali (expiry_date), formazione (expiry_date).
 *   Ritorna gli item entro l'orizzonte (default 90 gg) + tutti gli scaduti,
 *   con conteggi per fascia. Scoping azienda per DL/RSPP.
 */

const ALLOWED_READ = ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl', 'datore_lavoro', 'rspp'];

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setUTCHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const url = new URL(context.request.url);
  let companyId = url.searchParams.get('company_id');
  const horizon = Math.min(parseInt(url.searchParams.get('horizon') || '90'), 365);

  // DL/RSPP: forza lo scoping alla propria azienda
  if (['datore_lavoro', 'rspp'].includes(ctx.user.role)) {
    companyId = ctx.user.company_id;
  }

  const items: any[] = [];

  // 1) Visite / idoneità in scadenza (giudizio corrente con next_visit_date)
  let fq = supabaseAdmin
    .from('mdl_fitness_judgments')
    .select('id, next_visit_date, judgment_type, worker_id, company_id, next_visit_type, mdl_workers!inner(first_name, last_name, is_active), mdl_companies(business_name)')
    .eq('is_current', true)
    .eq('mdl_workers.is_active', true)
    .not('next_visit_date', 'is', null);
  if (companyId) fq = fq.eq('company_id', companyId);
  const { data: fj } = await fq;
  (fj || []).forEach((r: any) => {
    items.push({
      category: 'visita',
      title: 'Visita ' + (r.next_visit_type || 'periodica'),
      subject: `${r.mdl_workers?.last_name || ''} ${r.mdl_workers?.first_name || ''}`.trim(),
      company_name: r.mdl_companies?.business_name || null,
      company_id: r.company_id,
      worker_id: r.worker_id,
      due_date: r.next_visit_date,
      days_until: daysUntil(r.next_visit_date),
    });
  });

  // 2) Documenti aziendali in scadenza
  let dq = supabaseAdmin
    .from('mdl_documents')
    .select('id, title, document_type, expiry_date, company_id, mdl_companies(business_name)')
    .not('expiry_date', 'is', null);
  if (companyId) dq = dq.eq('company_id', companyId);
  const { data: docs } = await dq;
  (docs || []).forEach((r: any) => {
    items.push({
      category: 'documento',
      title: r.title || r.document_type,
      subject: r.title || r.document_type,
      company_name: r.mdl_companies?.business_name || null,
      company_id: r.company_id,
      due_date: r.expiry_date,
      days_until: daysUntil(r.expiry_date),
    });
  });

  // 3) Formazione in scadenza
  let tq = supabaseAdmin
    .from('mdl_training_records')
    .select('id, course_name, training_type, expiry_date, worker_id, mdl_workers!inner(first_name, last_name, company_id, is_active, mdl_companies(business_name))')
    .eq('mdl_workers.is_active', true)
    .not('expiry_date', 'is', null);
  if (companyId) tq = tq.eq('mdl_workers.company_id', companyId);
  const { data: tr } = await tq;
  (tr || []).forEach((r: any) => {
    items.push({
      category: 'formazione',
      title: r.course_name || r.training_type,
      subject: `${r.mdl_workers?.last_name || ''} ${r.mdl_workers?.first_name || ''}`.trim(),
      company_name: r.mdl_workers?.mdl_companies?.business_name || null,
      company_id: r.mdl_workers?.company_id || null,
      worker_id: r.worker_id,
      due_date: r.expiry_date,
      days_until: daysUntil(r.expiry_date),
    });
  });

  // Filtra entro orizzonte (+ tutti gli scaduti) e ordina per data
  const filtered = items
    .filter((i) => i.days_until !== null && i.days_until <= horizon)
    .sort((a, b) => (a.days_until || 0) - (b.days_until || 0));

  const counts = {
    scadute: filtered.filter((i) => i.days_until < 0).length,
    entro_30: filtered.filter((i) => i.days_until >= 0 && i.days_until <= 30).length,
    entro_60: filtered.filter((i) => i.days_until > 30 && i.days_until <= 60).length,
    entro_90: filtered.filter((i) => i.days_until > 60 && i.days_until <= 90).length,
    totale: filtered.length,
  };

  return Response.json({ success: true, data: filtered, counts });
};

/**
 * GET /api/reports/stats — Aggregated statistics for the MDL dashboard
 *
 * Returns:
 *   - summary: total companies, workers, active visits, deadlines
 *   - compliance: % of workers with valid fitness, overdue visits
 *   - monthly: visit counts per month (last 6 months)
 *   - by_company: top companies by worker count with compliance rate
 *   - visit_status_distribution: counts per status
 *
 * Roles:
 *   SA/MC/collaboratore/segreteria: full stats
 *   DL/RSPP: scoped to own company only
 *   lavoratore: forbidden (403)
 */

const ADMIN_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl'];
const COMPANY_ROLES = ['datore_lavoro', 'rspp'];
const ALLOWED_READ = [...ADMIN_ROLES, ...COMPANY_ROLES];

// Sentinel company used for protocol templates — excluded from stats
const SENTINEL_COMPANY_ID = '00000000-0000-4000-a000-000000000001';

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const isCompanyScoped = COMPANY_ROLES.includes(ctx.user.role);
  const scopeCompanyId = isCompanyScoped ? ctx.user.company_id : null;

  try {
    // ── 1. Summary counts ──────────────────────────────────────────────
    let companiesQuery = supabaseAdmin.from('mdl_companies').select('id', { count: 'exact', head: true }).eq('is_active', true).neq('id', SENTINEL_COMPANY_ID);
    if (scopeCompanyId) companiesQuery = companiesQuery.eq('id', scopeCompanyId);
    const { count: totalCompanies } = await companiesQuery;

    let workersQuery = supabaseAdmin.from('mdl_workers').select('id', { count: 'exact', head: true }).eq('is_active', true);
    if (scopeCompanyId) workersQuery = workersQuery.eq('company_id', scopeCompanyId);
    const { count: totalWorkers } = await workersQuery;

    const today = new Date().toISOString().slice(0, 10);
    let visitsToday = supabaseAdmin
      .from('mdl_visits')
      .select('id', { count: 'exact', head: true })
      .eq('scheduled_date', today)
      .in('status', ['programmata', 'confermata', 'in_corso']);
    if (scopeCompanyId) visitsToday = visitsToday.eq('company_id', scopeCompanyId);
    const { count: todayVisits } = await visitsToday;

    // ── 2. Compliance: fitness validity ────────────────────────────────
    let fitnessQuery = supabaseAdmin
      .from('mdl_fitness_judgments')
      .select('id, next_visit_date, judgment_type, worker_id')
      .eq('is_current', true);
    if (scopeCompanyId) fitnessQuery = fitnessQuery.eq('company_id', scopeCompanyId);
    const { data: fitnesses } = await fitnessQuery;

    let workersWithFitness = 0;
    let workersExpired = 0;
    let workersExpiring30 = 0;
    let workersValid = 0;
    const seenWorkers = new Set<string>();

    (fitnesses || []).forEach((f: any) => {
      if (seenWorkers.has(f.worker_id)) return;
      seenWorkers.add(f.worker_id);
      workersWithFitness++;
      if (!f.next_visit_date) {
        workersValid++;
        return;
      }
      const days = Math.round((new Date(f.next_visit_date).getTime() - new Date(today).getTime()) / 86400000);
      if (days < 0) workersExpired++;
      else if (days <= 30) workersExpiring30++;
      else workersValid++;
    });

    const complianceRate = (totalWorkers || 0) > 0
      ? Math.round((workersValid / (totalWorkers || 1)) * 100)
      : 0;

    // ── 3. Monthly visit distribution (last 6 months) ──────────────────
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    const sixMonthsStr = sixMonthsAgo.toISOString().slice(0, 10);

    let monthlyQuery = supabaseAdmin
      .from('mdl_visits')
      .select('scheduled_date, status')
      .gte('scheduled_date', sixMonthsStr)
      .not('scheduled_date', 'is', null);
    if (scopeCompanyId) monthlyQuery = monthlyQuery.eq('company_id', scopeCompanyId);
    const { data: monthlyVisits } = await monthlyQuery;

    const monthMap: Record<string, { total: number; completed: number }> = {};
    const MESI = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    // Pre-fill last 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
      monthMap[key] = { total: 0, completed: 0 };
    }
    (monthlyVisits || []).forEach((v: any) => {
      const key = (v.scheduled_date || '').slice(0, 7);
      if (monthMap[key]) {
        monthMap[key].total++;
        if (v.status === 'completata') monthMap[key].completed++;
      }
    });
    const monthly = Object.entries(monthMap).map(([key, val]) => {
      const [y, m] = key.split('-');
      return { month: MESI[parseInt(m) - 1] + ' ' + y, ...val };
    });

    // ── 4. Visit status distribution ───────────────────────────────────
    let statusQuery = supabaseAdmin
      .from('mdl_visits')
      .select('status');
    if (scopeCompanyId) statusQuery = statusQuery.eq('company_id', scopeCompanyId);
    const { data: allStatuses } = await statusQuery;

    const statusDist: Record<string, number> = {};
    (allStatuses || []).forEach((v: any) => {
      statusDist[v.status] = (statusDist[v.status] || 0) + 1;
    });

    // ── 5. Top companies by worker count (global only) ─────────────────
    let byCompany: any[] = [];
    if (!isCompanyScoped) {
      const { data: companies } = await supabaseAdmin
        .from('mdl_companies')
        .select('id, business_name, total_employees')
        .eq('is_active', true)
        .neq('id', SENTINEL_COMPANY_ID)
        .order('total_employees', { ascending: false })
        .limit(10);

      byCompany = (companies || []).map((c: any) => ({
        id: c.id,
        name: c.business_name,
        workers: c.total_employees || 0,
      }));
    }

    // ── 6. Deadlines summary ───────────────────────────────────────────
    let deadlineQuery = supabaseAdmin
      .from('mdl_fitness_judgments')
      .select('id, next_visit_date', { count: 'exact', head: false })
      .eq('is_current', true)
      .not('next_visit_date', 'is', null);
    if (scopeCompanyId) deadlineQuery = deadlineQuery.eq('company_id', scopeCompanyId);
    const { data: dlItems } = await deadlineQuery;

    let overdue = 0, within30 = 0, within60 = 0, within90 = 0;
    (dlItems || []).forEach((d: any) => {
      const days = Math.round((new Date(d.next_visit_date).getTime() - new Date(today).getTime()) / 86400000);
      if (days < 0) overdue++;
      else if (days <= 30) within30++;
      else if (days <= 60) within60++;
      else if (days <= 90) within90++;
    });

    return Response.json({
      success: true,
      data: {
        summary: {
          total_companies: totalCompanies || 0,
          total_workers: totalWorkers || 0,
          visits_today: todayVisits || 0,
          workers_with_fitness: workersWithFitness,
        },
        compliance: {
          rate: complianceRate,
          valid: workersValid,
          expiring_30: workersExpiring30,
          expired: workersExpired,
          without_fitness: Math.max(0, (totalWorkers || 0) - workersWithFitness),
        },
        deadlines: {
          overdue,
          within_30: within30,
          within_60: within60,
          within_90: within90,
        },
        monthly,
        visit_status: statusDist,
        by_company: byCompany,
      },
    });
  } catch (err: any) {
    return Response.json({ success: false, error: 'Errore report: ' + (err.message || 'Sconosciuto') }, { status: 500 });
  }
};

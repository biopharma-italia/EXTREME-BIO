/**
 * Export API — /api/export
 *
 * GET /api/export?type=workers|visits|deadlines|training&company_id=UUID&format=csv
 *
 * Exports data as CSV download.
 *
 * Roles: super_admin, medico_competente, segreteria_mdl, datore_lavoro (own company only)
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl'];
const ALLOWED_ROLES = [...MC_ROLES, 'datore_lavoro', 'rspp'];

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const url = new URL(context.request.url);
  const type = url.searchParams.get('type');
  const companyId = url.searchParams.get('company_id');

  if (!type || !['workers', 'visits', 'deadlines', 'training'].includes(type)) {
    return Response.json({ success: false, error: 'Tipo export non valido. Ammessi: workers, visits, deadlines, training' }, { status: 400 });
  }

  // DL/RSPP can only export own company
  const effectiveCompanyId = ['datore_lavoro', 'rspp'].includes(ctx.user.role)
    ? ctx.user.company_id
    : companyId;

  let csv = '';
  let filename = '';

  switch (type) {
    case 'workers':
      ({ csv, filename } = await exportWorkers(supabaseAdmin, effectiveCompanyId));
      break;
    case 'visits':
      ({ csv, filename } = await exportVisits(supabaseAdmin, effectiveCompanyId));
      break;
    case 'deadlines':
      ({ csv, filename } = await exportDeadlines(supabaseAdmin, effectiveCompanyId));
      break;
    case 'training':
      ({ csv, filename } = await exportTraining(supabaseAdmin, effectiveCompanyId));
      break;
  }

  // Audit log
  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    action: 'report_export',
    entity_type: type,
    entity_id: effectiveCompanyId || 'all',
    details: { action: 'csv_export', type, company_id: effectiveCompanyId },
    ip_address: ctx.ip,
  });

  // Return CSV with proper headers
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
};

// ─── Export Workers ──────────────────────────────────────────────────────────
async function exportWorkers(supabaseAdmin: any, companyId: string | null) {
  let query = supabaseAdmin
    .from('mdl_workers')
    .select('first_name, last_name, fiscal_code, date_of_birth, gender, email, phone, job_title, employment_status, hire_date, is_active, company_id, mdl_companies(business_name)')
    .eq('is_active', true)
    .order('last_name');

  if (companyId) query = query.eq('company_id', companyId);

  const { data } = await query;
  const rows = data || [];

  const headers = ['Cognome', 'Nome', 'Codice Fiscale', 'Data Nascita', 'Sesso', 'Email', 'Telefono', 'Mansione', 'Contratto', 'Assunzione', 'Azienda'];
  const csvRows = rows.map((w: any) => [
    w.last_name, w.first_name, w.fiscal_code || '', formatDate(w.date_of_birth),
    w.gender, w.email || '', w.phone || '', w.job_title || '',
    w.employment_status || '', formatDate(w.hire_date),
    w.mdl_companies?.business_name || '',
  ].map(escapeCsv).join(';'));

  const csv = '\ufeff' + [headers.join(';'), ...csvRows].join('\r\n');
  const filename = `lavoratori_${companyId ? 'azienda' : 'tutti'}_${today()}.csv`;
  return { csv, filename };
}

// ─── Export Visits ───────────────────────────────────────────────────────────
async function exportVisits(supabaseAdmin: any, companyId: string | null) {
  let query = supabaseAdmin
    .from('mdl_visits')
    .select('visit_date, visit_type, status, notes, mdl_workers(first_name, last_name, fiscal_code), mdl_companies(business_name)')
    .order('visit_date', { ascending: false })
    .limit(1000);

  if (companyId) query = query.eq('company_id', companyId);

  const { data } = await query;
  const rows = data || [];

  const headers = ['Data', 'Tipo', 'Stato', 'Lavoratore', 'CF', 'Azienda', 'Note'];
  const csvRows = rows.map((v: any) => [
    formatDate(v.visit_date), v.visit_type, v.status,
    `${v.mdl_workers?.last_name || ''} ${v.mdl_workers?.first_name || ''}`.trim(),
    v.mdl_workers?.fiscal_code || '',
    v.mdl_companies?.business_name || '',
    v.notes || '',
  ].map(escapeCsv).join(';'));

  const csv = '\ufeff' + [headers.join(';'), ...csvRows].join('\r\n');
  return { csv, filename: `visite_${today()}.csv` };
}

// ─── Export Deadlines ────────────────────────────────────────────────────────
async function exportDeadlines(supabaseAdmin: any, companyId: string | null) {
  let query = supabaseAdmin
    .from('mdl_workers')
    .select('first_name, last_name, fiscal_code, next_visit_date, job_title, mdl_companies(business_name)')
    .eq('is_active', true)
    .not('next_visit_date', 'is', null)
    .order('next_visit_date');

  if (companyId) query = query.eq('company_id', companyId);

  const { data } = await query;
  const rows = data || [];

  const headers = ['Scadenza', 'Cognome', 'Nome', 'CF', 'Mansione', 'Azienda'];
  const csvRows = rows.map((w: any) => [
    formatDate(w.next_visit_date), w.last_name, w.first_name,
    w.fiscal_code || '', w.job_title || '',
    w.mdl_companies?.business_name || '',
  ].map(escapeCsv).join(';'));

  const csv = '\ufeff' + [headers.join(';'), ...csvRows].join('\r\n');
  return { csv, filename: `scadenze_${today()}.csv` };
}

// ─── Export Training ─────────────────────────────────────────────────────────
async function exportTraining(supabaseAdmin: any, companyId: string | null) {
  let query = supabaseAdmin
    .from('mdl_training_records')
    .select('training_type, course_name, completion_date, expiry_date, status, provider, mdl_workers(first_name, last_name, fiscal_code, company_id, mdl_companies(business_name))')
    .order('expiry_date')
    .limit(1000);

  // Filter by company via workers
  const { data } = await query;
  let rows = data || [];

  if (companyId) {
    rows = rows.filter((r: any) => r.mdl_workers?.company_id === companyId);
  }

  const headers = ['Tipo Formazione', 'Corso', 'Completamento', 'Scadenza', 'Stato', 'Ente', 'Lavoratore', 'Azienda'];
  const csvRows = rows.map((t: any) => [
    t.training_type, t.course_name || '', formatDate(t.completion_date),
    formatDate(t.expiry_date), t.status || '',
    t.provider || '',
    `${t.mdl_workers?.last_name || ''} ${t.mdl_workers?.first_name || ''}`.trim(),
    t.mdl_workers?.mdl_companies?.business_name || '',
  ].map(escapeCsv).join(';'));

  const csv = '\ufeff' + [headers.join(';'), ...csvRows].join('\r\n');
  return { csv, filename: `formazione_${today()}.csv` };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function escapeCsv(val: string): string {
  if (!val) return '';
  if (val.includes(';') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function formatDate(d: string | null): string {
  if (!d) return '';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

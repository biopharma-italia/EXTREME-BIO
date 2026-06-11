/**
 * GET /api/reports/allegato-3b?company_id=UUID&year=YYYY
 *
 * Relazione Sanitaria Annuale — Allegato 3B (D.Lgs. 81/2008, art. 40)
 * Generates a PDF report with aggregate health surveillance stats for the company.
 *
 * Access: MC roles + super_admin only
 */

import { canViewClinicalData } from '../lib/permissions';

function fmtDateIT(d: string | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type PDFLine = { text: string; x: number; y: number; size?: number; bold?: boolean };

function buildPDF(lines: PDFLine[]): Uint8Array {
  const encoder = new TextEncoder();
  let stream = 'BT\n';
  for (const line of lines) {
    const fontName = line.bold ? '/F2' : '/F1';
    const size = line.size || 10;
    const safeText = line.text
      .replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
      .replace(/à/g, 'a').replace(/è/g, 'e').replace(/é/g, 'e')
      .replace(/ì/g, 'i').replace(/ò/g, 'o').replace(/ù/g, 'u');
    stream += `${fontName} ${size} Tf\n${line.x} ${line.y} Td\n(${safeText}) Tj\n0 0 Td\n`;
  }
  stream += 'ET\n';

  const objects: string[] = [];
  let objectCount = 0;
  function addObj(c: string) { objectCount++; objects.push(`${objectCount} 0 obj\n${c}\nendobj\n`); return objectCount; }
  addObj('<< /Type /Catalog /Pages 2 0 R >>');
  addObj('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  addObj('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 6 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> >>');
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  addObj('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  addObj(`<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}endstream`);

  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let body = '';
  const bodyOffsets: number[] = [];
  let off = header.length;
  for (const obj of objects) { bodyOffsets.push(off); body += obj; off += encoder.encode(obj).length; }
  const xrefOff = off;
  let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (const o of bodyOffsets) xref += o.toString().padStart(10, '0') + ' 00000 n \n';
  return encoder.encode(header + body + xref + `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOff}\n%%EOF\n`);
}

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !canViewClinicalData(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato — accesso riservato al MC' }, { status: 403 });
  }

  const url = new URL(context.request.url);
  const companyId = url.searchParams.get('company_id');
  const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));

  if (!companyId) {
    return Response.json({ success: false, error: 'company_id obbligatorio' }, { status: 400 });
  }

  const { supabaseAdmin } = ctx;
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  // Fetch company
  const { data: company } = await supabaseAdmin
    .from('mdl_companies')
    .select('business_name, vat_number, sector, risk_level, address_city, address_province, total_employees')
    .eq('id', companyId)
    .single();

  if (!company) {
    return Response.json({ success: false, error: 'Azienda non trovata' }, { status: 404 });
  }

  // Active workers in the year
  const { count: totalWorkers } = await supabaseAdmin
    .from('mdl_workers')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('is_active', true);

  // Visits in the year
  const { data: yearVisits } = await supabaseAdmin
    .from('mdl_visits')
    .select('visit_type, status')
    .eq('company_id', companyId)
    .gte('scheduled_date', yearStart)
    .lte('scheduled_date', yearEnd);

  const visits = yearVisits || [];
  const completedVisits = visits.filter((v: any) => v.status === 'completata').length;
  const programmedVisits = visits.filter((v: any) => v.status === 'programmata').length;
  const noShowVisits = visits.filter((v: any) => v.status === 'non_presentato').length;

  // Visit type breakdown
  const visitTypeCount: Record<string, number> = {};
  visits.forEach((v: any) => { visitTypeCount[v.visit_type] = (visitTypeCount[v.visit_type] || 0) + 1; });

  // Fitness judgments in the year
  const { data: yearJudgments } = await supabaseAdmin
    .from('mdl_fitness_judgments')
    .select('judgment_type')
    .eq('company_id', companyId)
    .gte('issued_date', yearStart)
    .lte('issued_date', yearEnd);

  const judgments = yearJudgments || [];
  const judgmentCount: Record<string, number> = {};
  judgments.forEach((j: any) => { judgmentCount[j.judgment_type] = (judgmentCount[j.judgment_type] || 0) + 1; });

  // Job roles with risk factors
  const { data: jobRoles } = await supabaseAdmin
    .from('mdl_job_roles')
    .select('role_name, risk_level, risk_factors, mdl_worker_jobs(count)')
    .eq('company_id', companyId)
    .eq('is_active', true);

  // Build PDF
  const L: PDFLine[] = [];
  let y = 790;
  const lm = 55;
  const lh = 13;
  const gap = 18;
  const col2 = 200;

  // Header
  L.push({ text: 'BIO-CLINIC S.r.l. — Medicina del Lavoro', x: lm, y, size: 12, bold: true });
  y -= lh;
  L.push({ text: 'D.Lgs. 81/2008, art. 40', x: lm, y, size: 8 });
  y -= gap;
  L.push({ text: `RELAZIONE SANITARIA ANNUALE — ALLEGATO 3B (Anno ${year})`, x: lm, y, size: 13, bold: true });

  // 1. Dati Azienda
  y -= gap;
  L.push({ text: '1. DATI UNITA PRODUTTIVA', x: lm, y, size: 10, bold: true });
  y -= lh;
  L.push({ text: 'Ragione Sociale:', x: lm, y, size: 9, bold: true });
  L.push({ text: company.business_name, x: col2, y, size: 9 });
  y -= lh;
  L.push({ text: 'P.IVA:', x: lm, y, size: 9, bold: true });
  L.push({ text: company.vat_number || '—', x: col2, y, size: 9 });
  L.push({ text: 'Settore:', x: 330, y, size: 9, bold: true });
  L.push({ text: company.sector || '—', x: 400, y, size: 9 });
  y -= lh;
  L.push({ text: 'Comune:', x: lm, y, size: 9, bold: true });
  L.push({ text: `${company.address_city || '—'} (${company.address_province || '—'})`, x: col2, y, size: 9 });
  L.push({ text: 'Rischio:', x: 330, y, size: 9, bold: true });
  L.push({ text: company.risk_level || '—', x: 400, y, size: 9 });
  y -= lh;
  L.push({ text: 'N. lavoratori sorvegliati:', x: lm, y, size: 9, bold: true });
  L.push({ text: String(totalWorkers || 0), x: col2, y, size: 9 });

  // 2. Attivita di sorveglianza sanitaria
  y -= gap;
  L.push({ text: '2. ATTIVITA DI SORVEGLIANZA SANITARIA', x: lm, y, size: 10, bold: true });
  y -= lh;
  L.push({ text: `Visite totali nell'anno ${year}:`, x: lm, y, size: 9, bold: true });
  L.push({ text: String(visits.length), x: col2, y, size: 9 });
  y -= lh;
  L.push({ text: 'Completate:', x: lm + 15, y, size: 9 });
  L.push({ text: String(completedVisits), x: col2, y, size: 9 });
  L.push({ text: 'Programmate:', x: 280, y, size: 9 });
  L.push({ text: String(programmedVisits), x: 370, y, size: 9 });
  L.push({ text: 'Non presentati:', x: 420, y, size: 9 });
  L.push({ text: String(noShowVisits), x: 520, y, size: 9 });

  y -= lh + 4;
  L.push({ text: 'Per tipologia:', x: lm, y, size: 9, bold: true });
  y -= lh;
  const VISIT_LABELS: Record<string, string> = {
    preventiva: 'Preventive', periodica: 'Periodiche', straordinaria: 'Straordinarie',
    cambio_mansione: 'Cambio mansione', rientro_malattia: 'Rientro malattia',
    cessazione: 'Cessazione', pre_assuntiva: 'Pre-assuntive',
  };
  Object.entries(visitTypeCount).forEach(([type, count]) => {
    L.push({ text: `${VISIT_LABELS[type] || type}: ${count}`, x: lm + 15, y, size: 8 });
    y -= lh - 2;
  });

  // 3. Giudizi di idoneita
  y -= gap / 2;
  L.push({ text: '3. GIUDIZI DI IDONEITA ESPRESSI', x: lm, y, size: 10, bold: true });
  y -= lh;
  L.push({ text: `Totale giudizi emessi: ${judgments.length}`, x: lm, y, size: 9 });
  y -= lh;
  const FITNESS_LABELS: Record<string, string> = {
    idoneo: 'Idonei', idoneo_con_prescrizioni: 'Idonei con prescrizioni',
    idoneo_con_limitazioni: 'Idonei con limitazioni',
    temporaneamente_non_idoneo: 'Temp. non idonei', non_idoneo: 'Non idonei',
  };
  Object.entries(judgmentCount).forEach(([type, count]) => {
    L.push({ text: `${FITNESS_LABELS[type] || type}: ${count}`, x: lm + 15, y, size: 9 });
    y -= lh;
  });
  if (judgments.length === 0) {
    L.push({ text: 'Nessun giudizio emesso nel periodo', x: lm + 15, y, size: 9 });
    y -= lh;
  }

  // 4. Mansioni e rischi
  y -= gap / 2;
  if (y < 200) y = 200;
  L.push({ text: '4. MANSIONI E FATTORI DI RISCHIO', x: lm, y, size: 10, bold: true });
  y -= lh;
  const roles = jobRoles || [];
  if (roles.length > 0) {
    L.push({ text: 'Mansione', x: lm, y, size: 8, bold: true });
    L.push({ text: 'Rischio', x: 200, y, size: 8, bold: true });
    L.push({ text: 'N. Lav.', x: 260, y, size: 8, bold: true });
    L.push({ text: 'Fattori di rischio', x: 310, y, size: 8, bold: true });
    y -= lh;
    roles.slice(0, 10).forEach((r: any) => {
      const count = r.mdl_worker_jobs?.[0]?.count || 0;
      L.push({ text: r.role_name || '—', x: lm, y, size: 8 });
      L.push({ text: r.risk_level || '—', x: 200, y, size: 8 });
      L.push({ text: String(count), x: 260, y, size: 8 });
      L.push({ text: (r.risk_factors || []).slice(0, 4).join(', ') || '—', x: 310, y, size: 7 });
      y -= lh - 1;
    });
  } else {
    L.push({ text: 'Nessuna mansione definita', x: lm + 15, y, size: 9 });
  }

  // Signature
  y -= gap;
  if (y < 80) y = 80;
  L.push({ text: 'Il Medico Competente', x: 350, y, size: 9, bold: true });
  y -= lh + 10;
  L.push({ text: '____________________________', x: 340, y, size: 9 });
  L.push({ text: `Data: ${fmtDateIT(new Date().toISOString())}`, x: lm, y, size: 9 });

  // Footer
  L.push({ text: `Generato da Bio-Clinic MDL — mdl.bio-clinic.it`, x: 180, y: 28, size: 7 });

  const pdfBytes = buildPDF(L);
  const fileName = `allegato_3B_${company.business_name.replace(/\s+/g, '_')}_${year}.pdf`;

  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id, user_role: ctx.user.role,
    action: 'allegato_3b_download', target_type: 'company', target_id: companyId,
    company_id: companyId, ip_address: ctx.ip,
    details: { year },
  });

  return new Response(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Cache-Control': 'no-store',
    },
  });
};

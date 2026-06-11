/**
 * GET /api/workers/:id/health-record-pdf — PDF Cartella Sanitaria e di Rischio
 * (Allegato 3A — D.Lgs. 81/2008, art. 25, comma 1, lett. c)
 *
 * Generates a comprehensive health record PDF for the worker.
 * Access: MC roles + super_admin only (clinical document)
 */

import {
  canViewClinicalData,
} from '../../lib/permissions';

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
      .replace(/ì/g, 'i').replace(/ò/g, 'o').replace(/ù/g, 'u')
      .replace(/À/g, 'A').replace(/È/g, 'E').replace(/É/g, 'E');
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
  const trailer = `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOff}\n%%EOF\n`;
  return encoder.encode(header + body + xref + trailer);
}

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  // Only clinical roles can access health record
  if (!ctx.user || !canViewClinicalData(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato — accesso riservato al Medico Competente' }, { status: 403 });
  }

  const workerId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  // Fetch worker with company
  const { data: worker, error: wErr } = await supabaseAdmin
    .from('mdl_workers')
    .select('*, mdl_companies(business_name, address_street, address_city, address_province, sector, risk_level)')
    .eq('id', workerId)
    .single();

  if (wErr || !worker) {
    return Response.json({ success: false, error: 'Lavoratore non trovato' }, { status: 404 });
  }

  // Fetch current job
  const { data: workerJob } = await supabaseAdmin
    .from('mdl_worker_jobs')
    .select('mdl_job_roles(role_name, risk_level, risk_factors)')
    .eq('worker_id', workerId)
    .eq('is_current', true)
    .maybeSingle();

  // Fetch visits
  const { data: visits } = await supabaseAdmin
    .from('mdl_visits')
    .select('*')
    .eq('worker_id', workerId)
    .order('scheduled_date', { ascending: false })
    .limit(20);

  // Fetch fitness judgments
  const { data: judgments } = await supabaseAdmin
    .from('mdl_fitness_judgments')
    .select('*')
    .eq('worker_id', workerId)
    .order('issued_date', { ascending: false });

  // Fetch training
  const { data: training } = await supabaseAdmin
    .from('mdl_training_records')
    .select('*')
    .eq('worker_id', workerId)
    .order('completion_date', { ascending: false })
    .limit(10);

  const co = worker.mdl_companies;
  const job = workerJob?.mdl_job_roles;
  const riskFactors = job?.risk_factors || [];

  const FITNESS_LABELS: Record<string, string> = {
    idoneo: 'Idoneo', idoneo_con_prescrizioni: 'Idoneo c/prescrizioni',
    idoneo_con_limitazioni: 'Idoneo c/limitazioni',
    temporaneamente_non_idoneo: 'Temp. non idoneo', non_idoneo: 'Non idoneo',
  };
  const VISIT_LABELS: Record<string, string> = {
    preventiva: 'Preventiva', periodica: 'Periodica', straordinaria: 'Straordinaria',
    cambio_mansione: 'Cambio Mansione', rientro_malattia: 'Rientro Malattia',
    cessazione: 'Cessazione', pre_assuntiva: 'Pre-Assuntiva',
  };

  // Build lines
  const L: PDFLine[] = [];
  let y = 790;
  const lm = 55;
  const lh = 13;
  const gap = 18;
  const col2 = 170;

  // Header
  L.push({ text: 'BIO-CLINIC S.r.l. — Medicina del Lavoro', x: lm, y, size: 12, bold: true });
  y -= lh;
  L.push({ text: 'D.Lgs. 81/2008, art. 25, comma 1, lett. c)', x: lm, y, size: 8 });
  y -= gap;
  L.push({ text: 'CARTELLA SANITARIA E DI RISCHIO (Allegato 3A)', x: lm, y, size: 13, bold: true });

  // Section 1: Dati Azienda
  y -= gap;
  L.push({ text: '1. DATI AZIENDA', x: lm, y, size: 10, bold: true });
  y -= lh;
  L.push({ text: 'Ragione Sociale:', x: lm, y, size: 9, bold: true });
  L.push({ text: co?.business_name || '—', x: col2, y, size: 9 });
  y -= lh;
  L.push({ text: 'Sede:', x: lm, y, size: 9, bold: true });
  L.push({ text: [co?.address_street, co?.address_city, co?.address_province ? `(${co.address_province})` : ''].filter(Boolean).join(', ') || '—', x: col2, y, size: 9 });
  y -= lh;
  L.push({ text: 'Settore:', x: lm, y, size: 9, bold: true });
  L.push({ text: co?.sector || '—', x: col2, y, size: 9 });
  L.push({ text: 'Rischio:', x: 330, y, size: 9, bold: true });
  L.push({ text: co?.risk_level || '—', x: 400, y, size: 9 });

  // Section 2: Dati Lavoratore
  y -= gap;
  L.push({ text: '2. DATI LAVORATORE', x: lm, y, size: 10, bold: true });
  y -= lh;
  L.push({ text: 'Cognome e Nome:', x: lm, y, size: 9, bold: true });
  L.push({ text: `${worker.last_name} ${worker.first_name}`, x: col2, y, size: 9 });
  y -= lh;
  L.push({ text: 'Codice Fiscale:', x: lm, y, size: 9, bold: true });
  L.push({ text: worker.fiscal_code || '—', x: col2, y, size: 9 });
  L.push({ text: 'Sesso:', x: 330, y, size: 9, bold: true });
  L.push({ text: worker.gender === 'M' ? 'Maschio' : worker.gender === 'F' ? 'Femmina' : '—', x: 400, y, size: 9 });
  y -= lh;
  L.push({ text: 'Data Nascita:', x: lm, y, size: 9, bold: true });
  L.push({ text: fmtDateIT(worker.date_of_birth), x: col2, y, size: 9 });
  L.push({ text: 'Luogo:', x: 330, y, size: 9, bold: true });
  L.push({ text: worker.place_of_birth || '—', x: 400, y, size: 9 });
  y -= lh;
  L.push({ text: 'Residenza:', x: lm, y, size: 9, bold: true });
  L.push({ text: [worker.address_street, worker.address_city, worker.address_province ? `(${worker.address_province})` : '', worker.address_zip].filter(Boolean).join(', ') || '—', x: col2, y, size: 9 });
  y -= lh;
  L.push({ text: 'Assunzione:', x: lm, y, size: 9, bold: true });
  L.push({ text: fmtDateIT(worker.hire_date), x: col2, y, size: 9 });
  L.push({ text: 'Contratto:', x: 330, y, size: 9, bold: true });
  L.push({ text: worker.contract_type || '—', x: 400, y, size: 9 });

  // Section 3: Mansione e Rischi
  y -= gap;
  L.push({ text: '3. MANSIONE E FATTORI DI RISCHIO', x: lm, y, size: 10, bold: true });
  y -= lh;
  L.push({ text: 'Mansione:', x: lm, y, size: 9, bold: true });
  L.push({ text: job?.role_name || '—', x: col2, y, size: 9 });
  L.push({ text: 'Rischio:', x: 330, y, size: 9, bold: true });
  L.push({ text: job?.risk_level || '—', x: 400, y, size: 9 });
  y -= lh;
  L.push({ text: 'Fattori di rischio:', x: lm, y, size: 9, bold: true });
  if (riskFactors.length > 0) {
    L.push({ text: riskFactors.slice(0, 6).join(', '), x: col2, y, size: 8 });
    if (riskFactors.length > 6) { y -= lh - 2; L.push({ text: riskFactors.slice(6).join(', '), x: col2, y, size: 8 }); }
  } else {
    L.push({ text: '—', x: col2, y, size: 9 });
  }

  // Section 4: Categorie particolari
  y -= gap;
  L.push({ text: '4. CATEGORIE PARTICOLARI', x: lm, y, size: 10, bold: true });
  y -= lh;
  const cats = [];
  if (worker.is_pregnant) cats.push('Gestante');
  if (worker.is_minor) cats.push('Lavoratore minorenne');
  if (worker.is_disabled) cats.push('Disabilita (' + (worker.disability_percentage || '—') + '%)');
  if (worker.is_night_worker) cats.push('Lavoratore notturno');
  L.push({ text: cats.length > 0 ? cats.join(' | ') : 'Nessuna categoria particolare', x: lm + 10, y, size: 9 });

  // Section 5: Storico visite
  y -= gap;
  L.push({ text: '5. STORICO VISITE MEDICHE', x: lm, y, size: 10, bold: true });
  y -= lh;
  const vList = visits || [];
  if (vList.length > 0) {
    L.push({ text: 'Data', x: lm, y, size: 8, bold: true });
    L.push({ text: 'Tipo', x: 140, y, size: 8, bold: true });
    L.push({ text: 'Stato', x: 280, y, size: 8, bold: true });
    L.push({ text: 'Luogo', x: 380, y, size: 8, bold: true });
    y -= lh - 2;
    vList.slice(0, 12).forEach((v: any) => {
      L.push({ text: fmtDateIT(v.scheduled_date), x: lm, y, size: 8 });
      L.push({ text: VISIT_LABELS[v.visit_type] || v.visit_type, x: 140, y, size: 8 });
      L.push({ text: v.status || '—', x: 280, y, size: 8 });
      L.push({ text: v.location || '—', x: 380, y, size: 8 });
      y -= lh - 2;
    });
  } else {
    L.push({ text: 'Nessuna visita registrata', x: lm + 10, y, size: 9 });
    y -= lh;
  }

  // Section 6: Giudizi di Idoneita
  y -= gap / 2;
  if (y < 200) y = 200; // safety
  L.push({ text: '6. GIUDIZI DI IDONEITA', x: lm, y, size: 10, bold: true });
  y -= lh;
  const jList = judgments || [];
  if (jList.length > 0) {
    L.push({ text: 'Data', x: lm, y, size: 8, bold: true });
    L.push({ text: 'Giudizio', x: 140, y, size: 8, bold: true });
    L.push({ text: 'Prossima visita', x: 320, y, size: 8, bold: true });
    L.push({ text: 'Attuale', x: 450, y, size: 8, bold: true });
    y -= lh - 2;
    jList.slice(0, 8).forEach((f: any) => {
      L.push({ text: fmtDateIT(f.issued_date), x: lm, y, size: 8 });
      L.push({ text: FITNESS_LABELS[f.judgment_type] || f.judgment_type, x: 140, y, size: 8 });
      L.push({ text: fmtDateIT(f.next_visit_date), x: 320, y, size: 8 });
      L.push({ text: f.is_current ? 'Si' : 'No', x: 450, y, size: 8 });
      y -= lh - 2;
    });
  } else {
    L.push({ text: 'Nessun giudizio registrato', x: lm + 10, y, size: 9 });
  }

  // Section 7: Formazione
  y -= gap / 2;
  if (y < 100) y = 100;
  L.push({ text: '7. FORMAZIONE SICUREZZA', x: lm, y, size: 10, bold: true });
  y -= lh;
  const tList = training || [];
  if (tList.length > 0) {
    tList.slice(0, 5).forEach((t: any) => {
      L.push({ text: `${fmtDateIT(t.completion_date)} — ${t.course_name || '—'} (${t.training_type || '—'})`, x: lm + 10, y, size: 8 });
      y -= lh - 2;
    });
  } else {
    L.push({ text: 'Nessun corso registrato', x: lm + 10, y, size: 9 });
  }

  // Footer
  L.push({ text: `Generato il ${fmtDateIT(new Date().toISOString())} — Bio-Clinic MDL — mdl.bio-clinic.it`, x: 140, y: 30, size: 7 });
  L.push({ text: 'Il Medico Competente _________________________', x: 300, y: 55, size: 9 });

  const pdfBytes = buildPDF(L);
  const fileName = `cartella_sanitaria_${worker.last_name}_${worker.first_name}.pdf`;

  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id, user_role: ctx.user.role,
    action: 'health_record_pdf_download', target_type: 'worker', target_id: workerId,
    company_id: worker.company_id, ip_address: ctx.ip,
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

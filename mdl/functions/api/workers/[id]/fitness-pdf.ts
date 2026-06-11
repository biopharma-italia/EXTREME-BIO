/**
 * GET /api/workers/:id/fitness-pdf — Generate PDF giudizio di idoneità
 *
 * Generates a simple PDF document with the latest fitness judgment for a worker.
 * Uses raw PDF binary construction (no external libs needed on CF Workers).
 * 
 * Access: MC roles + super_admin; DL/RSPP for own company; lavoratore for self
 */

import {
  ALL_INTERNAL_ROLES,
  canViewClinicalData,
  isCompanyBoundRole,
  isLavoratore,
} from '../../lib/permissions';

const FITNESS_LABELS: Record<string, string> = {
  idoneo: 'IDONEO alla mansione specifica',
  idoneo_con_prescrizioni: 'IDONEO con prescrizioni',
  idoneo_con_limitazioni: 'IDONEO con limitazioni',
  temporaneamente_non_idoneo: 'TEMPORANEAMENTE NON IDONEO',
  non_idoneo: 'NON IDONEO alla mansione specifica',
};

function fmtDateIT(d: string | null): string {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Builds a minimal valid PDF with text content.
 * Uses PDF 1.4 spec with a single page, Helvetica font.
 */
function buildPDF(lines: { text: string; x: number; y: number; size?: number; bold?: boolean }[], title: string): Uint8Array {
  const encoder = new TextEncoder();

  // PDF objects
  const objects: string[] = [];
  let objectCount = 0;
  const offsets: number[] = [];

  function addObject(content: string): number {
    objectCount++;
    objects.push(`${objectCount} 0 obj\n${content}\nendobj\n`);
    return objectCount;
  }

  // 1. Catalog
  addObject('<< /Type /Catalog /Pages 2 0 R >>');

  // 2. Pages
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');

  // Build content stream
  let stream = 'BT\n';
  for (const line of lines) {
    const fontName = line.bold ? '/F2' : '/F1';
    const size = line.size || 11;
    // Escape special PDF chars
    const safeText = line.text
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      // Convert common Italian chars to ASCII approximations for PDF core fonts
      .replace(/à/g, 'a').replace(/è/g, 'e').replace(/é/g, 'e')
      .replace(/ì/g, 'i').replace(/ò/g, 'o').replace(/ù/g, 'u')
      .replace(/À/g, 'A').replace(/È/g, 'E').replace(/É/g, 'E');
    stream += `${fontName} ${size} Tf\n`;
    stream += `${line.x} ${line.y} Td\n`;
    stream += `(${safeText}) Tj\n`;
    stream += `0 0 Td\n`; // reset position for next absolute
  }
  stream += 'ET\n';

  // 4. Content stream
  const streamBytes = encoder.encode(stream);
  addObject(`<< /Length ${streamBytes.length} >>\nstream\n${stream}endstream`);

  // 3. Page (references catalog=1, pages=2, content=4, fonts)
  // Insert page object at position 3 (we need to reorder)
  // Actually, let's just build properly:
  // We already have obj1=catalog, obj2=pages. Now obj3 should be page.
  // But we added content as obj3. Let's fix the ordering.

  // Reset and rebuild properly
  objects.length = 0;
  objectCount = 0;

  // Obj 1: Catalog
  addObject('<< /Type /Catalog /Pages 2 0 R >>');
  // Obj 2: Pages
  addObject('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  // Obj 3: Page
  addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 6 0 R /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> >>`);
  // Obj 4: Font Helvetica
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  // Obj 5: Font Helvetica-Bold
  addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  // Obj 6: Content stream
  addObject(`<< /Length ${streamBytes.length} >>\nstream\n${stream}endstream`);

  // Build PDF file
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  let body = '';
  const bodyOffsets: number[] = [];
  let currentOffset = header.length;

  for (const obj of objects) {
    bodyOffsets.push(currentOffset);
    body += obj;
    currentOffset += encoder.encode(obj).length;
  }

  // XRef
  const xrefOffset = currentOffset;
  let xref = `xref\n0 ${objectCount + 1}\n`;
  xref += '0000000000 65535 f \n';
  for (const off of bodyOffsets) {
    xref += off.toString().padStart(10, '0') + ' 00000 n \n';
  }

  // Trailer
  const trailer = `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const fullPdf = header + body + xref + trailer;
  return encoder.encode(fullPdf);
}

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALL_INTERNAL_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const workerId = (context.params as any).id;
  const { supabaseAdmin } = ctx;
  const role = ctx.user.role;

  // Fetch worker + company
  const { data: worker, error: wErr } = await supabaseAdmin
    .from('mdl_workers')
    .select('*, mdl_companies(business_name, address_street, address_city, address_province)')
    .eq('id', workerId)
    .single();

  if (wErr || !worker) {
    return Response.json({ success: false, error: 'Lavoratore non trovato' }, { status: 404 });
  }

  // Access control
  if (isCompanyBoundRole(role) && worker.company_id !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }
  if (isLavoratore(role)) {
    const { data: lp } = await supabaseAdmin.from('mdl_users').select('fiscal_code').eq('id', ctx.user.id).single();
    if (!lp?.fiscal_code || worker.fiscal_code !== lp.fiscal_code) {
      return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
    }
  }

  // Fetch latest fitness judgment
  const { data: fitness } = await supabaseAdmin
    .from('mdl_fitness_judgments')
    .select('*')
    .eq('worker_id', workerId)
    .eq('is_current', true)
    .maybeSingle();

  if (!fitness) {
    return Response.json({ success: false, error: 'Nessun giudizio di idoneita trovato per questo lavoratore' }, { status: 404 });
  }

  // Fetch current job role
  const { data: workerJob } = await supabaseAdmin
    .from('mdl_worker_jobs')
    .select('mdl_job_roles(role_name, risk_level)')
    .eq('worker_id', workerId)
    .eq('is_current', true)
    .maybeSingle();

  const jobRoleName = workerJob?.mdl_job_roles?.role_name || '—';
  const companyName = worker.mdl_companies?.business_name || '—';
  const companyAddr = [worker.mdl_companies?.address_street, worker.mdl_companies?.address_city, worker.mdl_companies?.address_province ? `(${worker.mdl_companies.address_province})` : ''].filter(Boolean).join(', ');
  const judgmentLabel = FITNESS_LABELS[fitness.judgment_type] || fitness.judgment_type;

  // Build PDF content
  const lines: { text: string; x: number; y: number; size?: number; bold?: boolean }[] = [];
  let y = 780;
  const leftMargin = 60;
  const lineHeight = 16;
  const sectionGap = 24;

  // Header
  lines.push({ text: 'BIO-CLINIC S.r.l.', x: leftMargin, y, size: 16, bold: true });
  y -= lineHeight;
  lines.push({ text: 'Medicina del Lavoro - Sorveglianza Sanitaria', x: leftMargin, y, size: 10 });
  y -= lineHeight;
  lines.push({ text: 'D.Lgs. 81/2008 e s.m.i.', x: leftMargin, y, size: 10 });

  y -= sectionGap + 8;
  lines.push({ text: 'GIUDIZIO DI IDONEITA ALLA MANSIONE SPECIFICA', x: leftMargin, y, size: 14, bold: true });

  // Company info
  y -= sectionGap;
  lines.push({ text: 'Azienda:', x: leftMargin, y, size: 10, bold: true });
  lines.push({ text: companyName, x: 160, y, size: 10 });
  y -= lineHeight;
  if (companyAddr) {
    lines.push({ text: 'Sede:', x: leftMargin, y, size: 10, bold: true });
    lines.push({ text: companyAddr, x: 160, y, size: 10 });
    y -= lineHeight;
  }

  // Worker info
  y -= sectionGap / 2;
  lines.push({ text: 'Lavoratore:', x: leftMargin, y, size: 10, bold: true });
  lines.push({ text: `${worker.last_name} ${worker.first_name}`, x: 160, y, size: 10 });
  y -= lineHeight;
  lines.push({ text: 'Codice Fiscale:', x: leftMargin, y, size: 10, bold: true });
  lines.push({ text: worker.fiscal_code || '—', x: 160, y, size: 10 });
  y -= lineHeight;
  lines.push({ text: 'Data di nascita:', x: leftMargin, y, size: 10, bold: true });
  lines.push({ text: fmtDateIT(worker.date_of_birth), x: 160, y, size: 10 });
  y -= lineHeight;
  lines.push({ text: 'Mansione:', x: leftMargin, y, size: 10, bold: true });
  lines.push({ text: jobRoleName, x: 160, y, size: 10 });

  // Judgment
  y -= sectionGap;
  lines.push({ text: 'GIUDIZIO:', x: leftMargin, y, size: 12, bold: true });
  y -= lineHeight + 4;
  lines.push({ text: judgmentLabel, x: leftMargin + 10, y, size: 13, bold: true });

  // Details
  y -= sectionGap;
  lines.push({ text: 'Data emissione:', x: leftMargin, y, size: 10, bold: true });
  lines.push({ text: fmtDateIT(fitness.issued_date), x: 160, y, size: 10 });
  y -= lineHeight;
  if (fitness.next_visit_date) {
    lines.push({ text: 'Prossima visita:', x: leftMargin, y, size: 10, bold: true });
    lines.push({ text: fmtDateIT(fitness.next_visit_date), x: 160, y, size: 10 });
    y -= lineHeight;
  }
  if (fitness.prescriptions) {
    y -= 4;
    lines.push({ text: 'Prescrizioni:', x: leftMargin, y, size: 10, bold: true });
    y -= lineHeight;
    // Split long text into multiple lines
    const prescWords = fitness.prescriptions.split(' ');
    let line = '';
    for (const word of prescWords) {
      if ((line + ' ' + word).length > 80) {
        lines.push({ text: line, x: leftMargin + 10, y, size: 9 });
        y -= lineHeight - 2;
        line = word;
      } else {
        line = line ? line + ' ' + word : word;
      }
    }
    if (line) { lines.push({ text: line, x: leftMargin + 10, y, size: 9 }); y -= lineHeight; }
  }
  if (fitness.limitations) {
    y -= 4;
    lines.push({ text: 'Limitazioni:', x: leftMargin, y, size: 10, bold: true });
    y -= lineHeight;
    const limWords = fitness.limitations.split(' ');
    let line = '';
    for (const word of limWords) {
      if ((line + ' ' + word).length > 80) {
        lines.push({ text: line, x: leftMargin + 10, y, size: 9 });
        y -= lineHeight - 2;
        line = word;
      } else {
        line = line ? line + ' ' + word : word;
      }
    }
    if (line) { lines.push({ text: line, x: leftMargin + 10, y, size: 9 }); y -= lineHeight; }
  }

  // Legal note
  y -= sectionGap;
  lines.push({ text: 'Avverso il presente giudizio e ammesso ricorso all\'organo di vigilanza', x: leftMargin, y, size: 8 });
  y -= lineHeight - 4;
  lines.push({ text: 'territorialmente competente (ASL), ai sensi dell\'art. 41, comma 9, D.Lgs. 81/08,', x: leftMargin, y, size: 8 });
  y -= lineHeight - 4;
  lines.push({ text: 'entro 30 giorni dalla data di comunicazione del giudizio stesso.', x: leftMargin, y, size: 8 });

  // Signature
  y -= sectionGap + 8;
  lines.push({ text: 'Il Medico Competente', x: 350, y, size: 10, bold: true });
  y -= lineHeight + 8;
  lines.push({ text: '____________________________', x: 340, y, size: 10 });
  y -= lineHeight;
  lines.push({ text: `Data: ${fmtDateIT(fitness.issued_date)}`, x: leftMargin, y, size: 9 });

  // Footer
  lines.push({ text: 'Documento generato da Bio-Clinic MDL — mdl.bio-clinic.it', x: 160, y: 30, size: 7 });

  const pdfBytes = buildPDF(lines, 'Giudizio Idoneita');
  const fileName = `idoneita_${worker.last_name}_${worker.first_name}_${fitness.issued_date || 'nd'}.pdf`;

  // Audit log
  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: 'fitness_pdf_download',
    target_type: 'worker',
    target_id: workerId,
    company_id: worker.company_id,
    ip_address: ctx.ip,
    details: { judgment_id: fitness.id },
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

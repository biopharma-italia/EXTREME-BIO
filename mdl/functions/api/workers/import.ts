/**
 * Workers Import CSV — /api/workers/import
 *
 * POST — Upload CSV file with worker data, bulk create workers
 *
 * CSV Format (semicolon or comma separated):
 *   cognome;nome;sesso;codice_fiscale;data_nascita;email;telefono;mansione
 *
 * Roles: super_admin, medico_competente, segreteria_mdl, datore_lavoro
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'segreteria_mdl'];
const ALLOWED_ROLES = [...MC_ROLES, 'datore_lavoro'];

export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await context.request.formData();
  } catch {
    return Response.json({ success: false, error: 'Richiesta multipart non valida' }, { status: 400 });
  }

  const file = formData.get('file') as File | null;
  const companyId = formData.get('company_id') as string | null;

  if (!file) {
    return Response.json({ success: false, error: 'File CSV obbligatorio' }, { status: 400 });
  }
  if (!companyId) {
    return Response.json({ success: false, error: 'company_id obbligatorio' }, { status: 400 });
  }

  // DL can only import to own company
  if (ctx.user.role === 'datore_lavoro' && companyId !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  // Verify company exists
  const { data: company } = await supabaseAdmin
    .from('mdl_companies')
    .select('id, business_name')
    .eq('id', companyId)
    .eq('is_active', true)
    .single();

  if (!company) {
    return Response.json({ success: false, error: 'Azienda non trovata' }, { status: 404 });
  }

  // Parse CSV
  const csvText = await file.text();
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());

  if (lines.length < 2) {
    return Response.json({ success: false, error: 'File CSV vuoto o senza righe dati' }, { status: 400 });
  }

  // Detect separator
  const headerLine = lines[0];
  const separator = headerLine.includes(';') ? ';' : ',';
  const headers = headerLine.split(separator).map(h => h.trim().toLowerCase().replace(/[""]/g, ''));

  // Map headers to expected fields
  const fieldMap: Record<string, string[]> = {
    last_name: ['cognome', 'last_name', 'surname'],
    first_name: ['nome', 'first_name', 'name'],
    gender: ['sesso', 'gender', 'sex'],
    fiscal_code: ['codice_fiscale', 'fiscal_code', 'cf', 'codicefiscale'],
    date_of_birth: ['data_nascita', 'date_of_birth', 'dob', 'data_di_nascita', 'nascita'],
    email: ['email', 'e-mail', 'mail'],
    phone: ['telefono', 'phone', 'tel', 'cellulare'],
    job_title: ['mansione', 'job_title', 'ruolo', 'qualifica', 'role'],
  };

  const colIndex: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(fieldMap)) {
    const idx = headers.findIndex(h => aliases.includes(h));
    if (idx >= 0) colIndex[field] = idx;
  }

  // Validate minimum columns
  if (colIndex.last_name === undefined || colIndex.first_name === undefined) {
    return Response.json({
      success: false,
      error: 'Colonne obbligatorie non trovate. Servono almeno: cognome, nome. Colonne rilevate: ' + headers.join(', ')
    }, { status: 400 });
  }

  // Get existing workers for duplicate check
  const { data: existingWorkers } = await supabaseAdmin
    .from('mdl_workers')
    .select('fiscal_code, first_name, last_name')
    .eq('company_id', companyId)
    .eq('is_active', true);

  const existingCFs = new Set((existingWorkers || []).map((w: any) => w.fiscal_code?.toUpperCase()).filter(Boolean));

  // Process rows
  const results = { created: 0, skipped: 0, errors: [] as string[] };
  const workersToInsert: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(separator).map(c => c.trim().replace(/^["']|["']$/g, ''));
    
    const getValue = (field: string) => colIndex[field] !== undefined ? cols[colIndex[field]]?.trim() || null : null;
    
    const lastName = getValue('last_name');
    const firstName = getValue('first_name');

    if (!lastName || !firstName) {
      results.errors.push(`Riga ${i + 1}: nome/cognome mancante`);
      results.skipped++;
      continue;
    }

    // Gender mapping
    let gender = (getValue('gender') || 'M').toUpperCase();
    if (gender === 'F' || gender === 'FEMMINA' || gender === 'DONNA') gender = 'F';
    else gender = 'M';

    // Fiscal code
    let cf: string | null = getValue('fiscal_code');
    if (cf) {
      cf = cf.toUpperCase();
      if (!/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/.test(cf)) {
        results.errors.push(`Riga ${i + 1}: CF non valido (${cf})`);
        cf = null; // Don't block import, just skip CF
      } else if (existingCFs.has(cf)) {
        results.errors.push(`Riga ${i + 1}: ${firstName} ${lastName} — CF duplicato, saltato`);
        results.skipped++;
        continue;
      }
    }

    // Date of birth
    let dob: string | null = getValue('date_of_birth');
    if (dob) {
      // Try DD/MM/YYYY or DD-MM-YYYY format
      const match = dob.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      if (match) {
        dob = `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        dob = null; // invalid format, skip
      }
    }

    workersToInsert.push({
      company_id: companyId,
      first_name: firstName,
      last_name: lastName,
      gender,
      fiscal_code: cf,
      date_of_birth: dob,
      email: getValue('email')?.toLowerCase() || null,
      phone: getValue('phone') || null,
      job_title: getValue('job_title') || null,
      employment_status: 'indeterminato',
      is_active: true,
    });

    if (cf) existingCFs.add(cf);
  }

  // Bulk insert
  if (workersToInsert.length > 0) {
    // Insert in batches of 50
    const batchSize = 50;
    for (let i = 0; i < workersToInsert.length; i += batchSize) {
      const batch = workersToInsert.slice(i, i + batchSize);
      const { error } = await supabaseAdmin
        .from('mdl_workers')
        .insert(batch);

      if (error) {
        results.errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        results.created += batch.length;
      }
    }
  }

  // Audit log
  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    action: 'admin_action',
    entity_type: 'worker_import',
    entity_id: companyId,
    details: {
      action: 'csv_import',
      company: company.business_name,
      total_rows: lines.length - 1,
      created: results.created,
      skipped: results.skipped,
      errors_count: results.errors.length,
    },
    ip_address: ctx.ip,
  });

  return Response.json({
    success: true,
    data: {
      total_rows: lines.length - 1,
      created: results.created,
      skipped: results.skipped,
      errors: results.errors.slice(0, 20), // max 20 errors shown
    }
  }, { status: 201 });
};

/**
 * Company Documents API — /api/companies/:id/documents
 *
 * GET    → List all documents for the company
 * POST   → Upload a new document (multipart/form-data)
 * DELETE  → Delete a document (query param ?doc_id=UUID)
 *
 * Document types (stored in mdl_documents):
 *   dvr               → DVR (Documento di Valutazione dei Rischi)
 *   nomina_mc         → Nomina Medico Competente firmata
 *   altro             → Visura Camerale, Documento Amministratore, etc.
 *                       (distinguished by title field)
 *
 * Roles:
 *   MC/segreteria     → full CRUD
 *   datore_lavoro     → CRUD for own company only
 */

const MC_ROLES = ['super_admin', 'medico_competente', 'medico_collaboratore', 'segreteria_mdl'];
const ALLOWED_READ = [...MC_ROLES, 'datore_lavoro', 'rspp'];
const ALLOWED_WRITE = [...MC_ROLES, 'datore_lavoro'];

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE = 25 * 1024 * 1024; // 25 MB

/**
 * Predefined document slots for company profile.
 * doc_type maps to mdl_document_type enum value.
 * slot_key is used as a unique identifier per company.
 */
const DOC_SLOTS = [
  { slot_key: 'dvr',                     doc_type: 'dvr',       label: 'DVR — Documento di Valutazione dei Rischi' },
  { slot_key: 'nomina_mc',               doc_type: 'nomina_mc', label: 'Nomina Medico Competente firmata' },
  { slot_key: 'visura_camerale',          doc_type: 'altro',     label: 'Visura Camerale' },
  { slot_key: 'documento_amministratore', doc_type: 'altro',     label: 'Documento Amministratore / Legale Rappresentante' },
];

// ─── GET ─────────────────────────────────────────────────────────────────────
export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const companyId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  // DL/RSPP only their own company
  if (['datore_lavoro', 'rspp'].includes(ctx.user.role) && companyId !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { data: docs, error } = await supabaseAdmin
    .from('mdl_documents')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, data: docs || [], slots: DOC_SLOTS });
};

// ─── POST (upload) ───────────────────────────────────────────────────────────
export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const companyId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  // DL can only upload for their own company
  if (ctx.user.role === 'datore_lavoro' && companyId !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File | null;
    const slotKey = formData.get('slot_key') as string;
    const effectiveDate = formData.get('effective_date') as string | null;
    const expiryDate = formData.get('expiry_date') as string | null;
    const notes = formData.get('notes') as string | null;

    if (!file || !slotKey) {
      return Response.json({ success: false, error: 'File e tipo documento obbligatori' }, { status: 400 });
    }

    // Validate slot
    const slot = DOC_SLOTS.find(s => s.slot_key === slotKey);
    if (!slot) {
      return Response.json({ success: false, error: 'Tipo documento non valido' }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return Response.json({ success: false, error: 'Formato file non consentito. Usa: PDF, JPEG, PNG' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ success: false, error: 'File troppo grande. Massimo 25 MB.' }, { status: 400 });
    }

    // Build storage path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `company_docs/${companyId}/${slotKey}/${timestamp}_${safeName}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabaseAdmin.storage
      .from('mdl-files')
      .upload(storagePath, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return Response.json({ success: false, error: 'Errore upload: ' + uploadError.message }, { status: 500 });
    }

    // Insert document record
    const { data: doc, error: insertError } = await supabaseAdmin
      .from('mdl_documents')
      .insert({
        company_id: companyId,
        document_type: slot.doc_type,
        title: slot.label,
        description: slotKey, // used as a machine-readable identifier
        storage_path: storagePath,
        original_name: file.name,
        mime_type: file.type,
        file_size_bytes: file.size,
        effective_date: effectiveDate || null,
        expiry_date: expiryDate || null,
        notes: notes || null,
        uploaded_by: ctx.user.id,
      })
      .select()
      .single();

    if (insertError) {
      // Clean up uploaded file on insert failure
      await supabaseAdmin.storage.from('mdl-files').remove([storagePath]);
      return Response.json({ success: false, error: 'Errore salvataggio: ' + insertError.message }, { status: 500 });
    }

    // Audit
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'document_upload',
      target_type: 'document',
      target_id: doc.id,
      company_id: companyId,
      ip_address: ctx.ip,
      details: {
        slot_key: slotKey,
        file_name: file.name,
        file_size: file.size,
        storage_path: storagePath,
      },
    });

    return Response.json({ success: true, data: doc }, { status: 201 });
  } catch (err: any) {
    return Response.json({ success: false, error: 'Errore: ' + (err.message || 'Sconosciuto') }, { status: 500 });
  }
};

// ─── DELETE ──────────────────────────────────────────────────────────────────
export const onRequestDelete: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const companyId = (context.params as any).id;
  const { supabaseAdmin } = ctx;

  // DL can only delete for their own company
  if (ctx.user.role === 'datore_lavoro' && companyId !== ctx.user.company_id) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const url = new URL(context.request.url);
  const docId = url.searchParams.get('doc_id');
  if (!docId) {
    return Response.json({ success: false, error: 'doc_id obbligatorio' }, { status: 400 });
  }

  // Fetch document to verify company ownership
  const { data: doc, error: fetchErr } = await supabaseAdmin
    .from('mdl_documents')
    .select('id, company_id, storage_path')
    .eq('id', docId)
    .eq('company_id', companyId)
    .single();

  if (fetchErr || !doc) {
    return Response.json({ success: false, error: 'Documento non trovato' }, { status: 404 });
  }

  // Delete from storage
  if (doc.storage_path) {
    await supabaseAdmin.storage.from('mdl-files').remove([doc.storage_path]);
  }

  // Delete from DB
  const { error: delErr } = await supabaseAdmin
    .from('mdl_documents')
    .delete()
    .eq('id', docId);

  if (delErr) {
    return Response.json({ success: false, error: delErr.message }, { status: 500 });
  }

  // Audit
  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: 'document_delete',
    target_type: 'document',
    target_id: docId,
    company_id: companyId,
    ip_address: ctx.ip,
    risk_level: 'medium',
  });

  return Response.json({ success: true, message: 'Documento eliminato' });
};

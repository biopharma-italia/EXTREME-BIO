/**
 * GET    /api/training/:id — Get single training record detail
 * PATCH  /api/training/:id — Update training record
 * DELETE /api/training/:id — Delete training record (hard delete)
 *
 * RBAC:
 *   - ADMIN_ROLES: full access
 *   - DL/RSPP: read/update/delete only for their own company workers
 *   - lavoratore: read only (own records), no update/delete
 */

import { ADMIN_ROLES, COMPANY_ROLES } from '../../lib/permissions';

const ALLOWED_READ = [...ADMIN_ROLES, ...COMPANY_ROLES, 'lavoratore'];
const ALLOWED_WRITE = [...ADMIN_ROLES, ...COMPANY_ROLES];

const VALID_TRAINING_TYPES = [
  'generale_4h', 'specifica_basso_4h', 'specifica_medio_8h', 'specifica_alto_12h',
  'aggiornamento_6h', 'preposti_8h', 'dirigenti_16h', 'rls_32h', 'rls_aggiornamento',
  'primo_soccorso_16h', 'primo_soccorso_aggiornamento',
  'antincendio_livello1', 'antincendio_livello2', 'antincendio_livello3',
  'carrellisti', 'gru', 'ple', 'dpi_terza_categoria', 'spazi_confinati',
  'lavori_quota', 'rischio_elettrico', 'altro',
];

/**
 * Helper: fetch training record with worker info and verify company scope
 */
async function getRecordWithScope(supabaseAdmin: any, recordId: string, user: any) {
  const { data: record, error } = await supabaseAdmin
    .from('mdl_training_records')
    .select('*, mdl_workers!inner(id, first_name, last_name, fiscal_code, company_id, mdl_companies(id, business_name))')
    .eq('id', recordId)
    .single();

  if (error || !record) {
    return { record: null, error: 'Record formazione non trovato' };
  }

  // Company scope check for DL/RSPP
  if ([...COMPANY_ROLES].includes(user.role)) {
    if (record.mdl_workers?.company_id !== user.company_id) {
      return { record: null, error: 'Non autorizzato per questo record' };
    }
  }

  // Lavoratore: self-only check
  if (user.role === 'lavoratore') {
    // Would need to verify the worker matches this lavoratore — handled at caller
  }

  return { record, error: null };
}

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_READ.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const recordId = (context.params as any).id;

  if (!recordId) {
    return Response.json({ success: false, error: 'ID record mancante' }, { status: 400 });
  }

  const { record, error } = await getRecordWithScope(supabaseAdmin, recordId, ctx.user);
  if (error) {
    return Response.json({ success: false, error }, { status: record ? 403 : 404 });
  }

  // Lavoratore: verify self-ownership
  if (ctx.user.role === 'lavoratore') {
    const { data: profile } = await supabaseAdmin
      .from('mdl_users')
      .select('fiscal_code')
      .eq('id', ctx.user.id)
      .single();
    if (profile?.fiscal_code && record.mdl_workers?.fiscal_code !== profile.fiscal_code) {
      return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
    }
  }

  return Response.json({ success: true, data: record });
};

export const onRequestPatch: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const recordId = (context.params as any).id;

  if (!recordId) {
    return Response.json({ success: false, error: 'ID record mancante' }, { status: 400 });
  }

  // Verify record exists and user has scope
  const { record: existing, error: scopeErr } = await getRecordWithScope(supabaseAdmin, recordId, ctx.user);
  if (scopeErr) {
    return Response.json({ success: false, error: scopeErr }, { status: existing ? 403 : 404 });
  }

  try {
    const body = await context.request.json() as any;
    const updateData: Record<string, any> = {};

    // Updatable fields
    if (body.training_type !== undefined) {
      if (!VALID_TRAINING_TYPES.includes(body.training_type)) {
        return Response.json({ success: false, error: 'training_type non valido' }, { status: 400 });
      }
      updateData.training_type = body.training_type;
    }
    if (body.course_name !== undefined) {
      if (!body.course_name.trim()) {
        return Response.json({ success: false, error: 'course_name non può essere vuoto' }, { status: 400 });
      }
      updateData.course_name = body.course_name.trim().slice(0, 300);
    }
    if (body.provider !== undefined) updateData.provider = body.provider ? body.provider.trim().slice(0, 200) : null;
    if (body.duration_hours !== undefined) updateData.duration_hours = body.duration_hours != null ? Math.min(parseFloat(body.duration_hours) || 0, 999.9) : null;
    if (body.completion_date !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.completion_date)) {
        return Response.json({ success: false, error: 'completion_date deve essere in formato YYYY-MM-DD' }, { status: 400 });
      }
      updateData.completion_date = body.completion_date;
    }
    if (body.expiry_date !== undefined) {
      if (body.expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.expiry_date)) {
        return Response.json({ success: false, error: 'expiry_date deve essere in formato YYYY-MM-DD' }, { status: 400 });
      }
      updateData.expiry_date = body.expiry_date || null;
    }
    if (body.certificate_number !== undefined) updateData.certificate_number = body.certificate_number ? body.certificate_number.trim().slice(0, 100) : null;
    if (body.certificate_path !== undefined) updateData.certificate_path = body.certificate_path || null;
    if (body.notes !== undefined) updateData.notes = body.notes ? body.notes.trim() : null;

    if (Object.keys(updateData).length === 0) {
      return Response.json({ success: false, error: 'Nessun campo da aggiornare' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('mdl_training_records')
      .update(updateData)
      .eq('id', recordId)
      .select()
      .single();

    if (error) {
      return Response.json({ success: false, error: error.message }, { status: 500 });
    }

    // Audit
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'training_update',
      target_type: 'training_record',
      target_id: recordId,
      company_id: existing.mdl_workers?.company_id || null,
      ip_address: ctx.ip,
      details: { updated_fields: Object.keys(updateData) },
    });

    return Response.json({ success: true, data });
  } catch {
    return Response.json({ success: false, error: 'Dati non validi' }, { status: 400 });
  }
};

export const onRequestDelete: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_WRITE.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const recordId = (context.params as any).id;

  if (!recordId) {
    return Response.json({ success: false, error: 'ID record mancante' }, { status: 400 });
  }

  // Verify record exists and user has scope
  const { record: existing, error: scopeErr } = await getRecordWithScope(supabaseAdmin, recordId, ctx.user);
  if (scopeErr) {
    return Response.json({ success: false, error: scopeErr }, { status: existing ? 403 : 404 });
  }

  // If there's a certificate file, remove it from storage
  if (existing.certificate_path) {
    await supabaseAdmin.storage
      .from('mdl-files')
      .remove([existing.certificate_path]);
  }

  const { error } = await supabaseAdmin
    .from('mdl_training_records')
    .delete()
    .eq('id', recordId);

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  // Audit
  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: 'training_delete',
    target_type: 'training_record',
    target_id: recordId,
    company_id: existing.mdl_workers?.company_id || null,
    ip_address: ctx.ip,
    details: {
      course_name: existing.course_name,
      training_type: existing.training_type,
      worker_id: existing.worker_id,
    },
  });

  return Response.json({ success: true, message: 'Record formazione eliminato' });
};

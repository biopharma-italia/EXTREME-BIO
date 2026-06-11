/**
 * PUT/GET /api/users/:id/signature — Electronic signature management
 *
 * E21: Firma elettronica semplice
 *
 * PUT: Upload signature image (base64 PNG from canvas) to Supabase Storage
 * GET: Retrieve signature image as base64 for PDF embedding
 *
 * Access:
 *  - MC roles can manage their own signature
 *  - super_admin can manage any user's signature
 */

import { canViewClinicalData } from '../../lib/permissions';

const BUCKET = 'mdl-files';
const SIGNATURE_PREFIX = 'signatures';

export const onRequestPut: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user) {
    return Response.json({ success: false, error: 'Non autenticato' }, { status: 401 });
  }

  const userId = (context.params as any).id as string;
  const { supabaseAdmin } = ctx;

  // Only the user themselves or super_admin can set a signature
  // Additionally, only clinical roles (MC) have a meaningful signature
  if (ctx.user.id !== userId && ctx.user.role !== 'super_admin') {
    return Response.json({ success: false, error: 'Non autorizzato a modificare questa firma' }, { status: 403 });
  }

  try {
    const body = await context.request.json() as { signature_data: string };
    if (!body.signature_data) {
      return Response.json({ success: false, error: 'Dati firma mancanti (signature_data)' }, { status: 400 });
    }

    // Validate base64 PNG
    const base64Match = body.signature_data.match(/^data:image\/png;base64,(.+)$/);
    if (!base64Match) {
      return Response.json({ success: false, error: 'Formato firma non valido. Atteso: data:image/png;base64,...' }, { status: 400 });
    }

    const base64Data = base64Match[1];
    // Decode base64 to binary
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    // Size check: max 500KB for a signature
    if (bytes.length > 500 * 1024) {
      return Response.json({ success: false, error: 'Firma troppo grande (max 500KB)' }, { status: 400 });
    }

    const filePath = `${SIGNATURE_PREFIX}/${userId}.png`;

    // Upload to Supabase Storage (upsert)
    const { error: uploadErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, bytes.buffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadErr) {
      return Response.json({ success: false, error: 'Errore upload firma: ' + uploadErr.message }, { status: 500 });
    }

    // Audit log
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      action: 'admin_action',
      entity_type: 'user',
      entity_id: userId,
      details: { action: 'signature_upload', target_user_id: userId },
      ip_address: ctx.ip,
    });

    return Response.json({
      success: true,
      message: 'Firma elettronica salvata con successo',
      path: filePath,
    });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message || 'Errore interno' }, { status: 500 });
  }
};

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user) {
    return Response.json({ success: false, error: 'Non autenticato' }, { status: 401 });
  }

  const userId = (context.params as any).id as string;
  const { supabaseAdmin } = ctx;

  // Any authenticated user can retrieve a signature (needed for PDF generation)
  // But practical use is by MC roles for their own signature in documents
  const filePath = `${SIGNATURE_PREFIX}/${userId}.png`;

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(filePath);

    if (error || !data) {
      return Response.json({
        success: false,
        error: 'Nessuna firma trovata per questo utente',
        has_signature: false,
      }, { status: 404 });
    }

    // Convert blob to base64
    const arrayBuffer = await data.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    const base64 = btoa(binary);

    return Response.json({
      success: true,
      has_signature: true,
      signature_data: `data:image/png;base64,${base64}`,
    });
  } catch (e: any) {
    return Response.json({ success: false, error: e.message || 'Errore interno' }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user) {
    return Response.json({ success: false, error: 'Non autenticato' }, { status: 401 });
  }

  const userId = (context.params as any).id as string;
  const { supabaseAdmin } = ctx;

  // Only the user themselves or super_admin
  if (ctx.user.id !== userId && ctx.user.role !== 'super_admin') {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const filePath = `${SIGNATURE_PREFIX}/${userId}.png`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .remove([filePath]);

  if (error) {
    return Response.json({ success: false, error: 'Errore eliminazione firma: ' + error.message }, { status: 500 });
  }

  // Audit
  await supabaseAdmin.from('mdl_audit_log').insert({
    user_id: ctx.user.id,
    action: 'admin_action',
    entity_type: 'user',
    entity_id: userId,
    details: { action: 'signature_delete', target_user_id: userId },
    ip_address: ctx.ip,
  });

  return Response.json({ success: true, message: 'Firma eliminata' });
};

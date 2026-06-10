/**
 * GET /api/files/download?path=referti/company_id/worker_id/file.pdf
 *
 * Generates a signed URL for downloading files from Supabase Storage (mdl-files bucket).
 * Returns the signed URL (valid for 5 minutes).
 *
 * PHASE 0 SECURITY FIX:
 *   - Segreteria restricted to same categories as DL/RSPP (idoneita, company_docs)
 *   - Only clinical roles can download referti (clinical exam results)
 *   - Uses centralised permissions module
 */

import {
  ALL_INTERNAL_ROLES,
  canDownloadClinicalFiles,
  isCompanyRole,
  NON_CLINICAL_DOWNLOAD_CATEGORIES,
} from '../lib/permissions';

const ALLOWED_ROLES = [...ALL_INTERNAL_ROLES];

export const onRequestGet: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;
  const url = new URL(context.request.url);
  const filePath = url.searchParams.get('path');

  if (!filePath) {
    return Response.json({ success: false, error: 'Parametro path obbligatorio' }, { status: 400 });
  }

  // Parse file path: category/company_id/worker_id/file
  const parts = filePath.split('/');
  const category = parts[0] || '';
  const pathCompanyId = parts[1] || '';

  // ── FIX: Non-clinical roles can only download non-clinical categories ──
  // This applies to: segreteria_mdl, datore_lavoro, rspp
  // Conforme D.Lgs. 81/2008 art. 25 + GDPR art. 9:
  //   il datore di lavoro accede solo al giudizio di idoneità (idoneita)
  //   e ai documenti aziendali (company_docs), mai ai referti/accertamenti.
  //   La segreteria segue le stesse restrizioni per i file clinici.
  if (!canDownloadClinicalFiles(ctx.user.role)) {
    if (!NON_CLINICAL_DOWNLOAD_CATEGORIES.includes(category)) {
      return Response.json({
        success: false,
        error: 'Non autorizzato ad accedere a file della categoria "' + category + '".',
      }, { status: 403 });
    }
  }

  // DL/RSPP: further restricted to their own company
  if (isCompanyRole(ctx.user.role)) {
    if (pathCompanyId !== ctx.user.company_id) {
      return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
    }
  }

  try {
    // Generate signed URL valid for 5 minutes
    const { data, error } = await supabaseAdmin.storage
      .from('mdl-files')
      .createSignedUrl(filePath, 300); // 300 seconds = 5 minutes

    if (error) {
      return Response.json({ success: false, error: 'File non trovato: ' + error.message }, { status: 404 });
    }

    // Audit download
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'file_download',
      target_type: 'file',
      ip_address: ctx.ip,
      risk_level: category === 'referti' ? 'high' : 'medium',
      details: { file_path: filePath, category },
    });

    return Response.json({
      success: true,
      data: {
        signedUrl: data.signedUrl,
        path: filePath,
        expiresIn: 300,
      },
    });
  } catch (err: any) {
    return Response.json({ success: false, error: 'Errore download: ' + (err.message || 'Sconosciuto') }, { status: 500 });
  }
};

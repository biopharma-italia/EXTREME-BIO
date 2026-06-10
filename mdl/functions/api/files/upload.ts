/**
 * POST /api/files/upload — Upload file to Supabase Storage (mdl-files bucket)
 *
 * Expects multipart/form-data with:
 *   - file: the PDF/image file
 *   - category: 'referti' | 'idoneita'
 *   - worker_id: UUID
 *   - visit_id: UUID (for referti)
 *   - exam_code: string (for referti — to link to visit_exam)
 *   - fitness_id: UUID (for idoneita — to link to fitness_judgment)
 *
 * Storage path: {category}/{company_id}/{worker_id}/{timestamp}_{filename}
 *
 * PHASE 0 SECURITY FIX:
 *   - Segreteria can upload only 'idoneita' and 'company_docs', NOT 'referti'
 *   - Only clinical roles can upload referti (clinical exam results)
 *   - Uses centralised permissions module
 */

import {
  ADMIN_ROLES,
  canUploadClinicalFiles,
  SEGRETERIA_UPLOAD_CATEGORIES,
} from '../lib/permissions';

const ALLOWED_ROLES = [...ADMIN_ROLES];
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export const onRequestPost: PagesFunction = async (context) => {
  const ctx = (context as any).data;
  if (!ctx.user || !ALLOWED_ROLES.includes(ctx.user.role)) {
    return Response.json({ success: false, error: 'Non autorizzato' }, { status: 403 });
  }

  const { supabaseAdmin } = ctx;

  try {
    const formData = await context.request.formData();
    const file = formData.get('file') as File | null;
    const category = formData.get('category') as string;
    const workerId = formData.get('worker_id') as string;
    const visitId = formData.get('visit_id') as string | null;
    const examCode = formData.get('exam_code') as string | null;
    const fitnessId = formData.get('fitness_id') as string | null;

    // Structured exam result fields (optional) — only MC fills these
    const fld = (k: string) => {
      const v = formData.get(k);
      return v === null || v === '' ? null : (v as string);
    };
    const numFld = (k: string) => {
      const v = fld(k);
      return v === null ? null : (isNaN(parseFloat(v)) ? null : parseFloat(v));
    };
    const examResult: Record<string, any> = {
      exam_name: fld('exam_name') || undefined,
      result_text: fld('result_text'),
      result_value: numFld('result_value'),
      result_unit: fld('result_unit'),
      reference_range: fld('reference_range'),
      lab_name: fld('lab_name'),
      is_normal: fld('is_normal') === 'true' ? true : (fld('is_normal') === 'false' ? false : null),
      is_abnormal: fld('is_abnormal') === 'true',
      exam_date: fld('exam_date') || new Date().toISOString().slice(0, 10),
    };
    const cleanResult = Object.fromEntries(
      Object.entries(examResult).filter(([, v]) => v !== null && v !== undefined)
    );

    if (!file || !category || !workerId) {
      return Response.json({ success: false, error: 'File, categoria e worker_id obbligatori' }, { status: 400 });
    }

    if (!['referti', 'idoneita'].includes(category)) {
      return Response.json({ success: false, error: 'Categoria non valida. Usa: referti, idoneita' }, { status: 400 });
    }

    // ── FIX: Segreteria cannot upload referti (clinical data) ────────────
    if (!canUploadClinicalFiles(ctx.user.role) && !SEGRETERIA_UPLOAD_CATEGORIES.includes(category)) {
      return Response.json({
        success: false,
        error: 'Non autorizzato a caricare file della categoria "' + category + '". Solo il Medico Competente puo caricare referti clinici.',
      }, { status: 403 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ success: false, error: 'Tipo file non consentito. Formati: PDF, JPEG, PNG' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return Response.json({ success: false, error: 'File troppo grande. Massimo 20MB.' }, { status: 400 });
    }

    // Get worker to verify and get company_id
    const { data: worker } = await supabaseAdmin
      .from('mdl_workers')
      .select('id, company_id')
      .eq('id', workerId)
      .single();

    if (!worker) {
      return Response.json({ success: false, error: 'Lavoratore non trovato' }, { status: 404 });
    }

    // Build storage path
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${category}/${worker.company_id}/${workerId}/${timestamp}_${safeName}`;

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

    // Update related record with the file path
    let linkedRecord = null;

    if (category === 'referti' && visitId && examCode) {
      // Link to visit_exam
      const { data: ve, error: veErr } = await supabaseAdmin
        .from('mdl_visit_exams')
        .update({ attachment_path: storagePath, ...cleanResult })
        .eq('visit_id', visitId)
        .eq('exam_code', examCode)
        .select()
        .maybeSingle();

      if (!veErr && !ve) {
        // Create new visit_exam record for this upload
        const { data: newVe } = await supabaseAdmin
          .from('mdl_visit_exams')
          .insert({
            visit_id: visitId,
            exam_code: examCode,
            exam_name: cleanResult.exam_name || examCode,
            attachment_path: storagePath,
            ...cleanResult,
          })
          .select()
          .single();
        linkedRecord = newVe;
      } else {
        linkedRecord = ve;
      }
    } else if (category === 'idoneita' && fitnessId) {
      // Link to fitness_judgment
      const { data: fj } = await supabaseAdmin
        .from('mdl_fitness_judgments')
        .update({ pdf_path: storagePath })
        .eq('id', fitnessId)
        .select()
        .single();
      linkedRecord = fj;
    }

    // Audit
    await supabaseAdmin.from('mdl_audit_log').insert({
      user_id: ctx.user.id,
      user_role: ctx.user.role,
      action: 'file_upload',
      target_type: category,
      target_id: workerId,
      company_id: worker.company_id,
      ip_address: ctx.ip,
      details: {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        storage_path: storagePath,
        linked_record: linkedRecord?.id || null,
      },
    });

    return Response.json({
      success: true,
      data: {
        path: storagePath,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        linked_record: linkedRecord,
      },
    }, { status: 201 });
  } catch (err: any) {
    return Response.json({ success: false, error: 'Errore upload: ' + (err.message || 'Sconosciuto') }, { status: 500 });
  }
};

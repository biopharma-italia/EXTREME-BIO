/**
 * ============================================================================
 * /api/reports/[id] — GET (detail) + PATCH (update)
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../_middleware';
import { sanitizeInput, validateUuid } from '../../../src/lib/validators';
import type { RequestContext, UserRole } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// Valid status transitions
const STATUS_TRANSITIONS: Record<string, { next: string; roles: UserRole[] }[]> = {
  pending: [{ next: 'validated', roles: ['lab_technician', 'admin', 'super_admin'] }],
  validated: [{ next: 'signed', roles: ['physician', 'admin', 'super_admin'] }],
  signed: [{ next: 'released', roles: ['lab_technician', 'admin', 'super_admin'] }],
};

// ── GET /api/reports/:id ─────────────────────────────────────────────────────

export async function onRequestGet(context: {
  request: Request;
  params: { id: string };
  data: { ctx: RequestContext; env: Env };
}) {
  const { data, params } = context;
  const { ctx, env } = data;

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  const reportId = params.id;
  if (!validateUuid(reportId)) {
    return jsonResponse({ success: false, error: 'ID referto non valido.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: report, error } = await adminClient
    .from('reports')
    .select(`
      *,
      patient:users!reports_patient_id_fkey(id, first_name, last_name, fiscal_code),
      uploader:users!reports_uploaded_by_fkey(first_name, last_name),
      validator:users!reports_validated_by_fkey(first_name, last_name),
      signer:users!reports_signed_by_fkey(first_name, last_name),
      report_files(id, original_name, mime_type, file_size_bytes, is_primary, page_count, created_at),
      notifications(channel, status, sent_at)
    `)
    .eq('id', reportId)
    .is('deleted_at', null)
    .single();

  if (error || !report) {
    return jsonResponse({ success: false, error: 'Referto non trovato.' }, 404);
  }

  // RBAC: patient can only see own released/signed reports
  if (ctx.user.role === 'patient') {
    if (report.patient_id !== ctx.user.id) {
      return jsonResponse({ success: false, error: 'Accesso negato.' }, 403);
    }
    if (!['released', 'signed'].includes(report.status)) {
      return jsonResponse({ success: false, error: 'Referto non ancora disponibile.' }, 403);
    }
  }

  // Mark as viewed (patient)
  if (ctx.user.role === 'patient' && !report.patient_viewed) {
    adminClient.from('reports').update({
      patient_viewed: true,
      patient_viewed_at: new Date().toISOString(),
    }).eq('id', reportId).then(() => {}).catch(() => {});
  }

  // Audit log
  adminClient.from('audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: 'report_view',
    target_type: 'report',
    target_id: reportId,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: { report_number: report.report_number },
    risk_level: 'low',
  }).then(() => {}).catch(() => {});

  const formatName = (u: { first_name: string; last_name: string } | null) =>
    u ? `${u.first_name} ${u.last_name}` : null;

  return jsonResponse({
    success: true,
    data: {
      id: report.id,
      report_number: report.report_number,
      report_type: report.report_type,
      category: report.category,
      department: report.department,
      sample_date: report.sample_date,
      sample_type: report.sample_type,
      analysis_date: report.analysis_date,
      status: report.status,
      is_urgent: report.is_urgent,
      has_abnormal_values: report.has_abnormal_values,
      physician_notes: ctx.user.role === 'patient' ? null : report.physician_notes,
      patient: report.patient,
      workflow: {
        uploaded_by: formatName(report.uploader),
        uploaded_at: report.created_at,
        validated_by: formatName(report.validator),
        validated_at: report.validated_at,
        signed_by: formatName(report.signer),
        signed_at: report.signed_at,
        released_at: report.released_at,
      },
      files: report.report_files,
      notifications: report.notifications,
    },
  });
}

// ── PATCH /api/reports/:id ───────────────────────────────────────────────────

export async function onRequestPatch(context: {
  request: Request;
  params: { id: string };
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data, params } = context;
  const { ctx, env } = data;

  // Ostetrica cannot modify reports (only view and delete)
  const authError = requireRole(ctx, 'lab_technician', 'physician', 'admin', 'super_admin');
  if (authError) return authError;

  const reportId = params.id;
  if (!validateUuid(reportId)) {
    return jsonResponse({ success: false, error: 'ID referto non valido.' }, 400);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get current report
  const { data: current } = await adminClient
    .from('reports')
    .select('id, status, patient_id, report_number')
    .eq('id', reportId)
    .is('deleted_at', null)
    .single();

  if (!current) {
    return jsonResponse({ success: false, error: 'Referto non trovato.' }, 404);
  }

  // Status transition validation
  const updateData: Record<string, unknown> = {};

  if (body.status && body.status !== current.status) {
    const newStatus = body.status as string;
    const allowed = STATUS_TRANSITIONS[current.status];

    if (!allowed) {
      return jsonResponse({
        success: false,
        error: `Impossibile modificare lo stato da '${current.status}'.`,
      }, 400);
    }

    const transition = allowed.find(t => t.next === newStatus);
    if (!transition) {
      return jsonResponse({
        success: false,
        error: `Transizione non valida: ${current.status} → ${newStatus}.`,
      }, 400);
    }

    if (!transition.roles.includes(ctx.user!.role)) {
      return jsonResponse({
        success: false,
        error: 'Permessi insufficienti per questa transizione di stato.',
      }, 403);
    }

    updateData.status = newStatus;

    // Set actor and timestamp based on new status
    switch (newStatus) {
      case 'validated':
        updateData.validated_by = ctx.user!.id;
        updateData.validated_at = new Date().toISOString();
        break;
      case 'signed':
        updateData.signed_by = ctx.user!.id;
        updateData.signed_at = new Date().toISOString();
        break;
      case 'released':
        updateData.released_by = ctx.user!.id;
        updateData.released_at = new Date().toISOString();
        break;
    }
  }

  // Other updatable fields
  if (body.has_abnormal_values !== undefined) {
    updateData.has_abnormal_values = body.has_abnormal_values === true;
  }
  if (body.physician_notes !== undefined) {
    updateData.physician_notes = sanitizeInput(body.physician_notes as string, 5000);
  }
  if (body.analysis_date) {
    updateData.analysis_date = body.analysis_date;
  }

  if (Object.keys(updateData).length === 0) {
    return jsonResponse({ success: false, error: 'Nessun campo da aggiornare.' }, 400);
  }

  const { error: updateError } = await adminClient
    .from('reports')
    .update(updateData)
    .eq('id', reportId);

  if (updateError) {
    console.error('[Reports] Update error:', updateError.message);
    return jsonResponse({ success: false, error: 'Errore nell\'aggiornamento.' }, 500);
  }

  return jsonResponse({
    success: true,
    data: { id: reportId, status: updateData.status || current.status },
  });
}

// ── DELETE /api/reports/:id (soft-delete) ────────────────────────────────────

export async function onRequestDelete(context: {
  request: Request;
  params: { id: string };
  data: { ctx: RequestContext; env: Env };
}) {
  const { data, params } = context;
  const { ctx, env } = data;

  // Admin, super_admin can delete any report; ostetrica can delete own uploads
  const authError = requireRole(ctx, 'admin', 'super_admin', 'ostetrica');
  if (authError) return authError;

  const reportId = params.id;
  if (!validateUuid(reportId)) {
    return jsonResponse({ success: false, error: 'ID referto non valido.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Get report
  const { data: report } = await adminClient
    .from('reports')
    .select('id, uploaded_by, report_number, status')
    .eq('id', reportId)
    .is('deleted_at', null)
    .single();

  if (!report) {
    return jsonResponse({ success: false, error: 'Referto non trovato.' }, 404);
  }

  // Ostetrica can only delete reports she uploaded
  if (ctx.user!.role === 'ostetrica' && report.uploaded_by !== ctx.user!.id) {
    return jsonResponse({
      success: false,
      error: 'Puoi eliminare solo i referti che hai caricato.',
    }, 403);
  }

  // Soft delete
  const { error: deleteError } = await adminClient
    .from('reports')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', reportId);

  if (deleteError) {
    console.error('[Reports] Delete error:', deleteError.message);
    return jsonResponse({ success: false, error: 'Errore nella cancellazione.' }, 500);
  }

  // Audit log
  adminClient.from('audit_log').insert({
    user_id: ctx.user!.id,
    user_role: ctx.user!.role,
    action: 'file_delete',
    target_type: 'report',
    target_id: reportId,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: {
      report_number: report.report_number,
      previous_status: report.status,
      method: 'soft_delete',
    },
    risk_level: 'high',
  }).then(() => {}).catch(() => {});

  return jsonResponse({
    success: true,
    data: { id: reportId, deleted: true },
  });
}

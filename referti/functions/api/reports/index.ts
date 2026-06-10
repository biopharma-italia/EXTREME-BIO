/**
 * ============================================================================
 * /api/reports — GET (list) + POST (create)
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../_middleware';
import { sanitizeInput, validateUuid, validateDate } from '../../../src/lib/validators';
import { reportCreatedEmail } from '../../../src/lib/email-templates';
import type { RequestContext } from '../../../src/lib/types';

/**
 * Escape SQL LIKE/ILIKE wildcards to prevent wildcard injection.
 * PostgREST uses `%` and `_` as wildcards in ilike filters.
 */
function escapeSqlWildcards(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RESEND_API_KEY: string;
  APP_URL: string;
  EMAIL_FROM: string;
}

// ── GET /api/reports — List reports ──────────────────────────────────────────

export async function onRequestGet(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') || '20')));
  const offset = (page - 1) * perPage;

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Build query
  let query = adminClient
    .from('reports')
    .select(`
      id, report_number, report_type, category, sample_date, status,
      is_urgent, has_abnormal_values, released_at, patient_viewed,
      download_count, patient_id, created_at,
      report_files(mime_type, file_size_bytes)
    `, { count: 'exact' })
    .is('deleted_at', null);

  // Role-based filtering
  if (ctx.user.role === 'patient') {
    query = query
      .eq('patient_id', ctx.user.id)
      .in('status', ['released', 'signed']);
  }

  // Query filters
  const status = url.searchParams.get('status');
  if (status) query = query.eq('status', status);

  const category = url.searchParams.get('category');
  if (category) query = query.eq('category', category);

  const from = url.searchParams.get('from');
  if (from && validateDate(from)) query = query.gte('sample_date', from);

  const to = url.searchParams.get('to');
  if (to && validateDate(to)) query = query.lte('sample_date', to);

  const search = url.searchParams.get('search');
  if (search) query = query.ilike('report_type', `%${escapeSqlWildcards(sanitizeInput(search, 100))}%`);

  const urgent = url.searchParams.get('urgent');
  if (urgent === 'true') query = query.eq('is_urgent', true);

  const abnormal = url.searchParams.get('abnormal');
  if (abnormal === 'true') query = query.eq('has_abnormal_values', true);

  // Sorting
  const sort = url.searchParams.get('sort') || 'sample_date';
  const order = url.searchParams.get('order') === 'asc';
  const allowedSortFields = ['sample_date', 'created_at', 'report_number', 'status', 'report_type'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'sample_date';
  query = query.order(sortField, { ascending: order });

  // Pagination
  query = query.range(offset, offset + perPage - 1);

  const { data: reports, error, count } = await query;

  if (error) {
    console.error('[Reports] List error:', error.message);
    return jsonResponse({ success: false, error: 'Errore nel caricamento dei referti.' }, 500);
  }

  // Transform for response
  const items = (reports || []).map((r: Record<string, unknown>) => ({
    id: r.id,
    report_number: r.report_number,
    report_type: r.report_type,
    category: r.category,
    sample_date: r.sample_date,
    status: r.status,
    is_urgent: r.is_urgent,
    has_abnormal_values: r.has_abnormal_values,
    released_at: r.released_at,
    patient_viewed: r.patient_viewed,
    download_count: r.download_count,
    file: Array.isArray(r.report_files) && r.report_files.length > 0
      ? { mime_type: r.report_files[0].mime_type, file_size_bytes: r.report_files[0].file_size_bytes }
      : undefined,
  }));

  // If patient is viewing, mark as viewed
  if (ctx.user.role === 'patient' && items.length > 0) {
    // Mark report_view in audit log (async, don't block)
    adminClient.from('audit_log').insert({
      user_id: ctx.user.id,
      user_role: 'patient',
      action: 'report_view',
      target_type: 'report',
      ip_address: ctx.ip,
      request_id: ctx.requestId,
      details: { view_type: 'list', count: items.length },
      risk_level: 'low',
    }).then(() => {}).catch(() => {});
  }

  return jsonResponse({
    success: true,
    data: items,
    pagination: {
      page,
      per_page: perPage,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / perPage),
    },
  });
}

// ── POST /api/reports — Create new report ───────────────────────────────────

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  // Only lab_technician, admin, super_admin, ostetrica can create reports
  const authError = requireRole(ctx, 'lab_technician', 'admin', 'super_admin', 'ostetrica');
  if (authError) return authError;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  // Validate
  const errors: string[] = [];

  if (!body.patient_id && !body.patient_fiscal_code) {
    errors.push('Specificare patient_id o patient_fiscal_code.');
  }
  if (!body.report_type) {
    errors.push('Tipo di referto obbligatorio.');
  }
  if (!body.sample_date || !validateDate(body.sample_date as string)) {
    errors.push('Data prelievo obbligatoria (formato YYYY-MM-DD).');
  }

  if (errors.length > 0) {
    return jsonResponse({ success: false, error: 'validation_error', details: errors }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Resolve patient
  let patientId = body.patient_id as string | undefined;

  if (!patientId && body.patient_fiscal_code) {
    const { data: patient } = await adminClient
      .from('users')
      .select('id')
      .eq('fiscal_code', (body.patient_fiscal_code as string).toUpperCase().trim())
      .eq('role', 'patient')
      .eq('is_active', true)
      .single();

    if (!patient) {
      return jsonResponse({
        success: false,
        error: 'patient_not_found',
        message: 'Paziente non trovato con questo codice fiscale.',
      }, 404);
    }
    patientId = patient.id;
  }

  if (patientId && !validateUuid(patientId)) {
    return jsonResponse({ success: false, error: 'ID paziente non valido.' }, 400);
  }

  // Create report
  const { data: report, error: insertError } = await adminClient
    .from('reports')
    .insert({
      patient_id: patientId,
      patient_fiscal_code: body.patient_fiscal_code
        ? (body.patient_fiscal_code as string).toUpperCase().trim()
        : null,
      report_type: sanitizeInput(body.report_type as string, 100),
      category: body.category ? sanitizeInput(body.category as string, 50) : null,
      department: 'laboratorio',
      sample_date: body.sample_date,
      sample_type: body.sample_type ? sanitizeInput(body.sample_type as string, 50) : null,
      status: 'pending',
      uploaded_by: ctx.user!.id,
      is_urgent: body.is_urgent === true,
      has_abnormal_values: body.has_abnormal_values === true,
      booking_id: body.booking_id ? sanitizeInput(body.booking_id as string, 50) : null,
      retention_expires: new Date(
        new Date(body.sample_date as string).getTime() + 10 * 365 * 24 * 60 * 60 * 1000
      ).toISOString().slice(0, 10),
    })
    .select('id, report_number, status')
    .single();

  if (insertError) {
    console.error('[Reports] Create error:', insertError.message);
    return jsonResponse({
      success: false,
      error: 'Errore nella creazione del referto.',
    }, 500);
  }

  // ── Send email notification to patient on report creation ────────────────
  // Notify patient that a new report has been created and is being processed
  console.log('[Reports] Email check — RESEND_API_KEY:', env.RESEND_API_KEY ? `set (${env.RESEND_API_KEY.substring(0, 6)}...)` : 'NOT SET', '| patientId:', patientId ? 'yes' : 'no');
  if (patientId && env.RESEND_API_KEY) {
    try {
      const { data: patient } = await adminClient
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', patientId)
        .single();

      if (patient?.email) {
        const appUrl = env.APP_URL || 'https://referti.bio-clinic.it';
        const emailFrom = env.EMAIL_FROM || 'Bio-Clinic Referti <referti@bio-clinic.it>';

        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: emailFrom,
            to: patient.email,
            subject: `Nuovo referto in lavorazione — ${report.report_number}`,
            html: reportCreatedEmail(
              `${patient.first_name} ${patient.last_name}`,
              report.report_number,
              sanitizeInput(body.report_type as string, 100),
              body.sample_date as string,
              appUrl
            ),
          }),
        });

        const emailSent = emailResp.ok;

        // Record notification in DB
        await adminClient.from('notifications').insert({
          user_id: patientId,
          channel: 'email',
          subject: `Nuovo referto in lavorazione — ${report.report_number}`,
          body: `Gentile ${patient.first_name}, il suo referto ${body.report_type} del ${body.sample_date} è stato registrato ed è in lavorazione.`,
          report_id: report.id,
          action_url: `${appUrl}/dashboard/`,
          status: emailSent ? 'sent' : 'failed',
          provider: 'resend',
          sent_at: emailSent ? new Date().toISOString() : null,
        });

        if (!emailSent) {
          const errBody = await emailResp.text();
          console.error('[Reports] Create notification email failed:', emailResp.status, errBody);
        } else {
          console.log('[Reports] Create notification email sent successfully to:', patient.email);
        }
      }
    } catch (err) {
      console.error('[Reports] Create notification error:', err);
    }
  } else if (patientId && !env.RESEND_API_KEY) {
    console.warn('[Reports] RESEND_API_KEY not configured — skipping email notification for report', report.report_number);
  }

  // Audit log
  await adminClient.from('audit_log').insert({
    user_id: ctx.user!.id,
    user_role: ctx.user!.role,
    action: 'report_create',
    target_type: 'report',
    target_id: report.id,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: {
      report_number: report.report_number,
      report_type: body.report_type,
      patient_id: patientId,
      email_sent: !!env.RESEND_API_KEY,
    },
    risk_level: 'low',
  });

  return jsonResponse({
    success: true,
    data: {
      id: report.id,
      report_number: report.report_number,
      status: report.status,
    },
  }, 201);
}

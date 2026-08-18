/**
 * ============================================================================
 * GET /api/admin/reports — List reports with patient names (service key)
 * ============================================================================
 * Used by the staff dashboard to list all reports with resolved patient names.
 * Uses SUPABASE_SERVICE_KEY to bypass RLS on the users table, avoiding the
 * client-side PostgREST embedded join which fails when RLS blocks access.
 *
 * Accessible by: lab_technician, physician, admin, super_admin, ostetrica
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../../_middleware';
import { sanitizeInput } from '../../../../src/lib/validators';
import type { RequestContext } from '../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

/**
 * Escape SQL LIKE/ILIKE wildcards to prevent wildcard injection.
 */
function escapeSqlWildcards(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

export async function onRequestGet(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  // Only staff roles can access this endpoint
  const authError = requireRole(ctx, 'lab_technician', 'physician', 'admin', 'super_admin', 'ostetrica');
  if (authError) return authError;

  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') || '100')));
  const offset = (page - 1) * perPage;

  // Service key client — bypasses RLS
  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Build query with patient join (service key bypasses RLS)
  let query = adminClient
    .from('reports')
    .select(`
      id, report_number, report_type, category, sample_date, status,
      is_urgent, has_abnormal_values, patient_fiscal_code,
      patient_notified, patient_notified_at,
      patient_viewed, patient_viewed_at,
      patient_downloaded, download_count,
      uploaded_by, released_at, created_at, updated_at,
      patient:patient_id ( first_name, last_name )
    `, { count: 'exact' })
    .is('deleted_at', null);

  // ── Filters ─────────────────────────────────────────────────────────────

  // Status filter
  const status = url.searchParams.get('status');
  if (status) query = query.eq('status', status);

  // Lab tech / ostetrica filter: only show reports uploaded by these users
  const uploadedBy = url.searchParams.get('uploaded_by');
  if (uploadedBy) {
    const ids = uploadedBy.split(',').filter(id => /^[0-9a-f-]{36}$/i.test(id));
    if (ids.length === 1) {
      query = query.eq('uploaded_by', ids[0]);
    } else if (ids.length > 1) {
      query = query.in('uploaded_by', ids);
    }
  }

  // Search (report_number or patient_fiscal_code)
  const search = url.searchParams.get('search');
  if (search) {
    const s = escapeSqlWildcards(sanitizeInput(search, 100));
    query = query.or(`report_number.ilike.%${s}%,patient_fiscal_code.ilike.%${s}%`);
  }

  // Sort + pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  const { data: reports, error, count } = await query;

  if (error) {
    console.error('[Admin Reports] List error:', error.message);
    return jsonResponse({ success: false, error: 'Errore nel caricamento dei referti.' }, 500);
  }

  // ── Resolve patient names for search-by-name ──────────────────────────
  // If search term doesn't look like a fiscal code or report number,
  // also search by patient name (separate query since ilike on joined table
  // isn't straightforward in PostgREST)
  let finalReports = reports || [];

  if (search && !/^(REF-|[A-Z]{6}\d{2})/i.test(search)) {
    const s = escapeSqlWildcards(sanitizeInput(search, 100));
    // Find patients matching the name search
    const { data: matchingPatients } = await adminClient
      .from('users')
      .select('id')
      .eq('role', 'patient')
      .or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%`)
      .is('deleted_at', null)
      .limit(50);

    if (matchingPatients && matchingPatients.length > 0) {
      const patientIds = matchingPatients.map((p: { id: string }) => p.id);
      // Fetch reports for these patients (that aren't already in results)
      const existingIds = new Set(finalReports.map((r: any) => r.id));

      let nameQuery = adminClient
        .from('reports')
        .select(`
          id, report_number, report_type, category, sample_date, status,
          is_urgent, has_abnormal_values, patient_fiscal_code,
          patient_notified, patient_notified_at,
          patient_viewed, patient_viewed_at,
          patient_downloaded, download_count,
          uploaded_by, released_at, created_at, updated_at,
          patient:patient_id ( first_name, last_name )
        `)
        .is('deleted_at', null)
        .in('patient_id', patientIds)
        .order('created_at', { ascending: false })
        .limit(perPage);

      if (status) nameQuery = nameQuery.eq('status', status);
      if (uploadedBy) {
        const ids = uploadedBy.split(',').filter(id => /^[0-9a-f-]{36}$/i.test(id));
        if (ids.length === 1) nameQuery = nameQuery.eq('uploaded_by', ids[0]);
        else if (ids.length > 1) nameQuery = nameQuery.in('uploaded_by', ids);
      }

      const { data: nameReports } = await nameQuery;

      if (nameReports) {
        // Merge, avoiding duplicates
        for (const r of nameReports) {
          if (!existingIds.has((r as any).id)) {
            finalReports.push(r as any);
          }
        }
        // Re-sort by created_at desc
        finalReports.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        // Trim to perPage
        finalReports = finalReports.slice(0, perPage);
      }
    }
  }

  // ── Reminder status enrichment ─────────────────────────────────────────
  // Mark reports whose patient already received a WhatsApp reminder
  // (sent by /api/cron/send-reminders, subject 'Promemoria referto disponibile')
  const releasedIds = finalReports
    .filter((r: any) => r.status === 'released')
    .map((r: any) => r.id);

  if (releasedIds.length > 0) {
    const { data: reminderRows } = await adminClient
      .from('notifications')
      .select('report_id, sent_at')
      .in('report_id', releasedIds)
      .eq('channel', 'whatsapp')
      .eq('status', 'sent')
      .eq('subject', 'Promemoria referto disponibile');

    const reminderMap = new Map<string, string | null>();
    (reminderRows || []).forEach((n: { report_id: string; sent_at: string | null }) => {
      if (!reminderMap.has(n.report_id)) reminderMap.set(n.report_id, n.sent_at);
    });

    finalReports = finalReports.map((r: any) =>
      r.status === 'released'
        ? { ...r, reminder_sent: reminderMap.has(r.id), reminder_sent_at: reminderMap.get(r.id) || null }
        : r
    );
  }

  // ── Count queries for dashboard stats ─────────────────────────────────
  // Return counts alongside data for the stat cards
  const buildCountFilter = (statusFilter?: string) => {
    let q = adminClient
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .is('deleted_at', null);
    if (statusFilter) q = q.eq('status', statusFilter);
    if (uploadedBy) {
      const ids = uploadedBy.split(',').filter(id => /^[0-9a-f-]{36}$/i.test(id));
      if (ids.length === 1) q = q.eq('uploaded_by', ids[0]);
      else if (ids.length > 1) q = q.in('uploaded_by', ids);
    }
    return q;
  };

  const [
    { count: pendingCount },
    { count: validatedCount },
    { count: releasedCount },
    { count: totalCount },
  ] = await Promise.all([
    buildCountFilter('pending'),
    buildCountFilter('validated'),
    buildCountFilter('released'),
    buildCountFilter(),
  ]);

  return jsonResponse({
    success: true,
    data: finalReports,
    counts: {
      pending: pendingCount || 0,
      validated: validatedCount || 0,
      released: releasedCount || 0,
      total: totalCount || 0,
    },
    pagination: {
      page,
      per_page: perPage,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / perPage),
    },
  });
}

/**
 * ============================================================================
 * GET /api/admin/reports/queue — Reports requiring action
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../../_middleware';
import type { RequestContext } from '../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export async function onRequestGet(context: {
  data: { ctx: RequestContext; env: Env };
}) {
  const { data } = context;
  const { ctx, env } = data;

  const authError = requireRole(ctx, 'lab_technician', 'admin', 'super_admin', 'ostetrica');
  if (authError) return authError;

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: reports, error } = await adminClient
    .from('reports')
    .select(`
      id, report_number, report_type, status, is_urgent, created_at,
      patient:users!reports_patient_id_fkey(first_name, last_name)
    `)
    .in('status', ['pending', 'validated', 'signed'])
    .is('deleted_at', null)
    .order('is_urgent', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(100);

  if (error) {
    return jsonResponse({ success: false, error: 'Errore.' }, 500);
  }

  const now = Date.now();
  const items = (reports || []).map((r: Record<string, unknown>) => {
    const patient = r.patient as { first_name: string; last_name: string } | null;
    const actionMap: Record<string, string> = {
      pending: 'Validazione richiesta',
      validated: 'Firma medico richiesta',
      signed: 'Rilascio al paziente',
    };
    return {
      id: r.id,
      report_number: r.report_number,
      report_type: r.report_type,
      patient_name: patient ? `${patient.first_name} ${patient.last_name}` : 'N/D',
      status: r.status,
      action_required: actionMap[r.status as string] || '',
      is_urgent: r.is_urgent,
      created_at: r.created_at,
      age_hours: Math.round((now - new Date(r.created_at as string).getTime()) / 3600000 * 10) / 10,
    };
  });

  return jsonResponse({ success: true, data: items });
}

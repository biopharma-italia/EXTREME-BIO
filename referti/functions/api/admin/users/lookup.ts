/**
 * ============================================================================
 * POST /api/admin/users/lookup — Find patient by fiscal code
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../../_middleware';
import { validateFiscalCode } from '../../../../src/lib/validators';
import type { RequestContext } from '../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  const authError = requireRole(ctx, 'lab_technician', 'admin', 'super_admin', 'ostetrica');
  if (authError) return authError;

  let body: { fiscal_code?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  if (!body.fiscal_code || !validateFiscalCode(body.fiscal_code)) {
    return jsonResponse({ success: false, error: 'Codice fiscale non valido.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: patient } = await adminClient
    .from('users')
    .select('id, first_name, last_name, fiscal_code, email')
    .eq('fiscal_code', body.fiscal_code.toUpperCase().trim())
    .eq('role', 'patient')
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();

  if (!patient) {
    return jsonResponse({
      success: false,
      error: 'patient_not_found',
      message: 'Nessun paziente trovato. Vuoi creare un nuovo account?',
    }, 404);
  }

  // Count reports
  const { count: reportsCount } = await adminClient
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', patient.id)
    .is('deleted_at', null);

  return jsonResponse({
    success: true,
    data: {
      ...patient,
      reports_count: reportsCount || 0,
    },
  });
}

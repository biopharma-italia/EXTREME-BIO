/**
 * ============================================================================
 * POST /api/admin/gipo/lookup — Cerca paziente nell'anagrafica GIPO
 * ============================================================================
 * Cercato dal dashboard quando il CF non è trovato in "users".
 * Restituisce i dati anagrafici GIPO per pre-compilare il form di creazione.
 *
 * Body: { "fiscal_code": "RSSMRA80A01H501U" }
 * Response: { success: true, data: { first_name, last_name, email, ... } }
 *       o: { success: false, error: "not_found" }
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

  // Solo staff autorizzato
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

  const fc = body.fiscal_code.toUpperCase().trim();

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: patient } = await adminClient
    .from('gipo_patients')
    .select('id, fiscal_code, first_name, last_name, email, phone, date_of_birth, gender, address, city, province, zip_code, gipo_patient_id, synced_at')
    .eq('fiscal_code', fc)
    .eq('is_active', true)
    .single();

  if (!patient) {
    return jsonResponse({
      success: false,
      error: 'not_found',
      message: 'Paziente non trovato nell\'anagrafica GIPO.',
    }, 404);
  }

  return jsonResponse({
    success: true,
    source: 'gipo',
    data: patient,
  });
}

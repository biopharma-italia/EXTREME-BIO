/**
 * ============================================================================
 * POST /api/admin/gipo/sync — Sincronizza pazienti da GIPO (Claw Agent)
 * ============================================================================
 * Chiamato dall'agente Claw per inserire/aggiornare i pazienti estratti
 * da GipoNext. Supporta sia singolo paziente che batch.
 *
 * Auth: richiede service_role key (Claw) OPPURE admin/super_admin token.
 *
 * Body (singolo):
 *   { "patient": { fiscal_code, first_name, last_name, email?, phone?, ... } }
 *
 * Body (batch):
 *   { "patients": [ { fiscal_code, first_name, last_name, ... }, ... ] }
 *
 * Response:
 *   { success: true, synced: N, errors: [...] }
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../_middleware';
import { validateFiscalCode } from '../../../../src/lib/validators';
import type { RequestContext } from '../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  GIPO_SYNC_API_KEY?: string;
}

interface GipoPatient {
  fiscal_code: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  province?: string;
  zip_code?: string;
  gipo_patient_id?: string;
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  // Auth: accettare X-Gipo-Sync-Key (Claw agent) oppure token admin/super_admin.
  // Questa rotta è PUBLIC_ROUTES nel middleware, quindi ctx.user può essere null.
  const apiKey = request.headers.get('X-Gipo-Sync-Key');
  const isApiKeyAuth = env.GIPO_SYNC_API_KEY && apiKey === env.GIPO_SYNC_API_KEY;

  if (!isApiKeyAuth) {
    // Fallback: verifica token admin manualmente
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return jsonResponse({
        success: false,
        error: 'Autenticazione richiesta. Usa X-Gipo-Sync-Key o un token admin.',
      }, 401);
    }

    // Verifica token con Supabase
    const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const anonClient = createClient(env.SUPABASE_URL, env.SUPABASE_URL ? env.SUPABASE_SERVICE_KEY : '', {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return jsonResponse({ success: false, error: 'Token non valido.' }, 401);
    }

    const { data: profile } = await adminClient
      .from('users')
      .select('role')
      .eq('auth_id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return jsonResponse({
        success: false,
        error: 'Permessi insufficienti. Richiesto admin o super_admin.',
      }, 403);
    }
  }

  let body: { patient?: GipoPatient; patients?: GipoPatient[] };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'JSON non valido.' }, 400);
  }

  // Normalizza: singolo → array
  const patients: GipoPatient[] = body.patients || (body.patient ? [body.patient] : []);

  if (patients.length === 0) {
    return jsonResponse({ success: false, error: 'Nessun paziente fornito.' }, 400);
  }

  if (patients.length > 500) {
    return jsonResponse({ success: false, error: 'Massimo 500 pazienti per chiamata.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  let synced = 0;
  const errors: { fiscal_code: string; error: string }[] = [];

  for (const p of patients) {
    // Validazione
    if (!p.fiscal_code || !p.first_name || !p.last_name) {
      errors.push({
        fiscal_code: p.fiscal_code || '???',
        error: 'Campi obbligatori mancanti: fiscal_code, first_name, last_name',
      });
      continue;
    }

    const fc = p.fiscal_code.toUpperCase().trim();
    if (!validateFiscalCode(fc)) {
      errors.push({ fiscal_code: fc, error: 'Codice fiscale non valido.' });
      continue;
    }

    const record: Record<string, unknown> = {
      fiscal_code: fc,
      first_name: p.first_name.trim(),
      last_name: p.last_name.trim(),
      synced_at: new Date().toISOString(),
      sync_source: 'claw_agent',
      is_active: true,
    };

    if (p.email) record.email = p.email.toLowerCase().trim();
    if (p.phone) record.phone = p.phone.trim();
    if (p.date_of_birth) record.date_of_birth = p.date_of_birth;
    if (p.gender && ['M', 'F', 'X'].includes(p.gender.toUpperCase())) {
      record.gender = p.gender.toUpperCase();
    }
    if (p.address) record.address = p.address.trim();
    if (p.city) record.city = p.city.trim();
    if (p.province) record.province = p.province.toUpperCase().trim();
    if (p.zip_code) record.zip_code = p.zip_code.trim();
    if (p.gipo_patient_id) record.gipo_patient_id = p.gipo_patient_id.trim();

    // UPSERT: se il CF esiste, aggiorna; se no, inserisce
    const { error: upsertError } = await adminClient
      .from('gipo_patients')
      .upsert(record, { onConflict: 'fiscal_code' });

    if (upsertError) {
      errors.push({ fiscal_code: fc, error: upsertError.message });
    } else {
      synced++;
    }
  }

  return jsonResponse({
    success: true,
    synced,
    total: patients.length,
    errors: errors.length > 0 ? errors : undefined,
  });
}

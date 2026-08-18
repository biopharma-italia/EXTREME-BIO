/**
 * ============================================================================
 * POST /api/admin/users/batch-lookup — Batch patient lookup by fiscal codes
 * ============================================================================
 * Used by the bulk upload feature. Receives an array of fiscal codes and
 * returns the lookup result for each one:
 *   - "users"     → patient already has an account
 *   - "gipo"      → found in GIPO registry (can auto-create profile)
 *   - "not_found" → unknown patient
 *
 * Body: { "fiscal_codes": ["NCRPLA01D50A091W", "RSSMRC85A01H501Z", ...] }
 * Max: 100 fiscal codes per request.
 *
 * Response: {
 *   success: true,
 *   results: {
 *     "NCRPLA01D50A091W": { source: "users", data: { id, first_name, last_name, email, fiscal_code } },
 *     "RSSMRC85A01H501Z": { source: "gipo",  data: { first_name, last_name, email, phone, ... } },
 *     "BNCLRA90B41F205X": { source: "not_found" }
 *   }
 * }
 */

import { createClient } from '@supabase/supabase-js';
import { requireRole, jsonResponse } from '../../_middleware';
import { validateFiscalCode } from '../../../../src/lib/validators';
import type { RequestContext } from '../../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

interface LookupResult {
  source: 'users' | 'gipo' | 'not_found';
  data?: Record<string, unknown>;
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  // Only authorized staff
  const authError = requireRole(ctx, 'lab_technician', 'admin', 'super_admin', 'ostetrica');
  if (authError) return authError;

  let body: { fiscal_codes?: string[] };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  if (!body.fiscal_codes || !Array.isArray(body.fiscal_codes) || body.fiscal_codes.length === 0) {
    return jsonResponse({ success: false, error: 'Fornire un array di codici fiscali.' }, 400);
  }

  if (body.fiscal_codes.length > 100) {
    return jsonResponse({ success: false, error: 'Massimo 100 codici fiscali per richiesta.' }, 400);
  }

  // Validate and normalize all fiscal codes
  const validCodes: string[] = [];
  const invalidCodes: string[] = [];

  for (const fc of body.fiscal_codes) {
    const cleaned = (fc || '').toString().toUpperCase().trim();
    if (cleaned && validateFiscalCode(cleaned)) {
      validCodes.push(cleaned);
    } else {
      invalidCodes.push(fc);
    }
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const results: Record<string, LookupResult> = {};

  // Mark invalid codes
  for (const fc of invalidCodes) {
    results[fc] = { source: 'not_found' };
  }

  if (validCodes.length === 0) {
    return jsonResponse({ success: true, results });
  }

  // ── Step 1: Batch lookup in "users" table ──────────────────────────────────
  const { data: usersFound } = await adminClient
    .from('users')
    .select('id, first_name, last_name, fiscal_code, email, phone')
    .in('fiscal_code', validCodes)
    .eq('role', 'patient')
    .eq('is_active', true)
    .is('deleted_at', null);

  const foundInUsers = new Set<string>();

  if (usersFound) {
    for (const u of usersFound) {
      const fc = u.fiscal_code.toUpperCase();
      foundInUsers.add(fc);
      results[fc] = {
        source: 'users',
        data: {
          id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          phone: u.phone,
          fiscal_code: u.fiscal_code,
        },
      };
    }
  }

  // ── Step 2: Remaining codes → lookup in "gipo_patients" ────────────────────
  const remainingCodes = validCodes.filter((fc) => !foundInUsers.has(fc));

  if (remainingCodes.length > 0) {
    const { data: gipoFound } = await adminClient
      .from('gipo_patients')
      .select('id, fiscal_code, first_name, last_name, email, phone, date_of_birth, gender, address, city, province, zip_code, gipo_patient_id')
      .in('fiscal_code', remainingCodes)
      .eq('is_active', true);

    const foundInGipo = new Set<string>();

    if (gipoFound) {
      for (const g of gipoFound) {
        const fc = g.fiscal_code.toUpperCase();
        foundInGipo.add(fc);
        results[fc] = {
          source: 'gipo',
          data: {
            gipo_id: g.id,
            first_name: g.first_name,
            last_name: g.last_name,
            email: g.email,
            phone: g.phone,
            date_of_birth: g.date_of_birth,
            gender: g.gender,
            address: g.address,
            city: g.city,
            province: g.province,
            zip_code: g.zip_code,
            fiscal_code: g.fiscal_code,
            gipo_patient_id: g.gipo_patient_id,
          },
        };
      }
    }

    // ── Step 3: Mark remaining as not_found ────────────────────────────────────
    for (const fc of remainingCodes) {
      if (!foundInGipo.has(fc)) {
        results[fc] = { source: 'not_found' };
      }
    }
  }

  return jsonResponse({
    success: true,
    total: body.fiscal_codes.length,
    found_users: foundInUsers.size,
    found_gipo: Object.values(results).filter((r) => r.source === 'gipo').length,
    not_found: Object.values(results).filter((r) => r.source === 'not_found').length,
    results,
  });
}

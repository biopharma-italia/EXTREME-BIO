/**
 * ============================================================================
 * POST /api/admin/users/phone-audit — Audit numeri di telefono pazienti
 * ============================================================================
 * Analizza tutti i pazienti e classifica i numeri di telefono:
 *   - missing:  nessun numero registrato
 *   - invalid:  numero presente ma non normalizzabile in E.164
 *   - landline: numero fisso (non riceve WhatsApp)
 *   - ok:       numero mobile valido
 *
 * Per i pazienti "missing"/"invalid" cerca il numero in gipo_patients
 * (match rigoroso per fiscal_code + conferma nome/cognome) e segnala se
 * il recupero è possibile SENZA ambiguità.
 *
 * Modalità:
 *   - default: DRY-RUN — solo analisi, ZERO scritture
 *   - { "apply": true }: applica i recuperi sicuri (solo campi phone VUOTI,
 *     mai sovrascrittura di numeri esistenti validi)
 *
 * Auth: admin/super_admin token OPPURE X-Cron-Secret (analisi da tooling).
 * Route in PUBLIC_ROUTES → auth gestita internamente (come gipo/sync).
 *
 * @version 1.0.0 — 2026-08-19
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../../_middleware';
import { formatPhoneE164 } from '../../../../src/lib/whatsapp';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  CRON_SECRET?: string;
}

interface PatientRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  fiscal_code: string | null;
  phone: string | null;
  role: string;
  is_active: boolean;
}

interface GipoRow {
  fiscal_code: string;
  first_name: string;
  last_name: string;
  phone: string | null;
}

function norm(s: string | null | undefined): string {
  return (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Classify a raw phone value. */
function classifyPhone(phone: string | null): 'missing' | 'invalid' | 'landline' | 'ok' {
  if (!phone || !phone.trim()) return 'missing';
  const e164 = formatPhoneE164(phone);
  if (!e164) return 'invalid';
  // Italian landline: +390... (mobile starts +393)
  if (e164.startsWith('+390')) return 'landline';
  return 'ok';
}

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: { user?: { role?: string } | null }; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  // ── Auth: admin token (via middleware ctx) OR X-Cron-Secret ───────────────
  const cronSecret = request.headers.get('X-Cron-Secret') || '';
  const secretOk = !!env.CRON_SECRET && cronSecret === env.CRON_SECRET;
  const roleOk = !!ctx?.user?.role && ['admin', 'super_admin'].includes(ctx.user.role!);

  if (!secretOk && !roleOk) {
    return jsonResponse({ success: false, error: 'Non autorizzato.' }, 401);
  }

  let body: { apply?: boolean } = {};
  try { body = await request.json(); } catch { /* empty body ok */ }
  const apply = body.apply === true;

  const db = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // ── 1. Load all active patients ────────────────────────────────────────────
  const { data: patients, error: pErr } = await db
    .from('users')
    .select('id, email, first_name, last_name, fiscal_code, phone, role, is_active')
    .eq('role', 'patient')
    .eq('is_active', true)
    .order('last_name');

  if (pErr) {
    return jsonResponse({ success: false, error: 'Query users fallita: ' + pErr.message }, 500);
  }

  const all = (patients || []) as PatientRow[];

  // ── 2. Classify ────────────────────────────────────────────────────────────
  const missing: PatientRow[] = [];
  const invalid: PatientRow[] = [];
  const landline: PatientRow[] = [];
  let okCount = 0;

  for (const p of all) {
    const cls = classifyPhone(p.phone);
    if (cls === 'missing') missing.push(p);
    else if (cls === 'invalid') invalid.push(p);
    else if (cls === 'landline') landline.push(p);
    else okCount++;
  }

  // ── 3. GIPO lookup for problematic patients (strict, zero-ambiguity) ───────
  const problematic = [...missing, ...invalid];
  const fcs = problematic.map((p) => (p.fiscal_code || '').toUpperCase().trim()).filter(Boolean);

  let gipoRows: GipoRow[] = [];
  if (fcs.length > 0) {
    const { data: g } = await db
      .from('gipo_patients')
      .select('fiscal_code, first_name, last_name, phone')
      .in('fiscal_code', fcs)
      .eq('is_active', true);
    gipoRows = (g || []) as GipoRow[];
  }
  const gipoByFc = new Map<string, GipoRow[]>();
  for (const g of gipoRows) {
    const key = (g.fiscal_code || '').toUpperCase().trim();
    if (!gipoByFc.has(key)) gipoByFc.set(key, []);
    gipoByFc.get(key)!.push(g);
  }

  type AuditEntry = {
    id: string;
    name: string;
    email: string;
    fiscal_code: string | null;
    current_phone: string | null;
    status: string;
    gipo_phone: string | null;
    gipo_phone_e164: string | null;
    recoverable: boolean;
    reason: string;
  };

  const entries: AuditEntry[] = [];

  for (const p of problematic) {
    const status = missing.includes(p) ? 'missing' : 'invalid';
    const fc = (p.fiscal_code || '').toUpperCase().trim();
    const entry: AuditEntry = {
      id: p.id,
      name: `${p.first_name} ${p.last_name}`,
      email: p.email,
      fiscal_code: p.fiscal_code,
      current_phone: p.phone,
      status,
      gipo_phone: null,
      gipo_phone_e164: null,
      recoverable: false,
      reason: '',
    };

    if (!fc) {
      entry.reason = 'no_fiscal_code';
      entries.push(entry);
      continue;
    }

    const matches = gipoByFc.get(fc) || [];
    if (matches.length === 0) {
      entry.reason = 'not_in_gipo';
      entries.push(entry);
      continue;
    }
    if (matches.length > 1) {
      entry.reason = 'multiple_gipo_matches'; // ambiguo → mai auto-applicare
      entries.push(entry);
      continue;
    }

    const g = matches[0];
    entry.gipo_phone = g.phone;

    // Safety check 1: name confirmation (both first and last name must match)
    const nameMatch = norm(g.first_name) === norm(p.first_name) && norm(g.last_name) === norm(p.last_name);
    if (!nameMatch) {
      entry.reason = 'name_mismatch'; // CF combacia ma nome diverso → mai auto-applicare
      entries.push(entry);
      continue;
    }

    // Safety check 2: GIPO phone must normalize to a valid Italian MOBILE
    if (!g.phone || !g.phone.trim()) {
      entry.reason = 'gipo_phone_missing';
      entries.push(entry);
      continue;
    }
    const e164 = formatPhoneE164(g.phone);
    if (!e164) {
      entry.reason = 'gipo_phone_invalid';
      entries.push(entry);
      continue;
    }
    if (!e164.startsWith('+393')) {
      entry.gipo_phone_e164 = e164;
      entry.reason = 'gipo_phone_not_mobile'; // fisso o estero → segnalato ma non auto-applicato
      entries.push(entry);
      continue;
    }

    // Safety check 3 (apply only): never overwrite an existing valid number.
    // For 'invalid' status we DO allow replacing, but only in apply mode and
    // it is reported separately so the operator sees old → new.
    entry.gipo_phone_e164 = e164;
    entry.recoverable = true;
    entry.reason = status === 'missing' ? 'fill_empty' : 'replace_invalid';
    entries.push(entry);
  }

  const recoverable = entries.filter((e) => e.recoverable);
  const notRecoverable = entries.filter((e) => !e.recoverable);

  // ── 4. Apply (optional, safe subset only) ──────────────────────────────────
  const applied: { id: string; name: string; old: string | null; new: string }[] = [];
  const applyErrors: { id: string; name: string; error: string }[] = [];

  if (apply && recoverable.length > 0) {
    for (const e of recoverable) {
      // Re-check current value right before write (guard against races)
      const { data: fresh } = await db
        .from('users')
        .select('phone')
        .eq('id', e.id)
        .single();

      const currentCls = classifyPhone((fresh as { phone: string | null } | null)?.phone ?? null);
      if (currentCls === 'ok' || currentCls === 'landline') {
        applyErrors.push({ id: e.id, name: e.name, error: 'skipped: phone changed meanwhile' });
        continue;
      }

      const { error: uErr } = await db
        .from('users')
        .update({ phone: e.gipo_phone_e164 })
        .eq('id', e.id);

      if (uErr) {
        applyErrors.push({ id: e.id, name: e.name, error: uErr.message });
      } else {
        applied.push({ id: e.id, name: e.name, old: e.current_phone, new: e.gipo_phone_e164! });
      }
    }

    // Audit log
    await db.from('audit_log').insert({
      user_id: null,
      user_role: roleOk ? ctx.user!.role : 'system',
      action: 'user_update',
      target_type: 'user',
      target_id: null,
      ip_address: request.headers.get('CF-Connecting-IP') || 'phone-audit',
      user_agent: 'admin/users/phone-audit',
      request_id: crypto.randomUUID(),
      details: {
        type: 'phone_recovery_from_gipo',
        applied: applied.length,
        errors: applyErrors.length,
        entries: applied,
      },
      risk_level: 'medium',
    });
  }

  return jsonResponse({
    success: true,
    mode: apply ? 'apply' : 'dry-run',
    summary: {
      total_patients: all.length,
      phone_ok: okCount,
      phone_landline: landline.length,
      phone_missing: missing.length,
      phone_invalid: invalid.length,
      gipo_recoverable: recoverable.length,
      not_recoverable: notRecoverable.length,
      applied: applied.length,
      apply_errors: applyErrors.length,
    },
    landline_patients: landline.map((p) => ({
      id: p.id, name: `${p.first_name} ${p.last_name}`, phone: p.phone,
    })),
    recoverable,
    not_recoverable: notRecoverable,
    applied,
    apply_errors: applyErrors,
  });
}

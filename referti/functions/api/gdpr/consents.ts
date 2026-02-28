/**
 * ============================================================================
 * /api/gdpr/consents — GET + POST consent management
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_middleware';
import type { RequestContext, ConsentType } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// ── GET /api/gdpr/consents ───────────────────────────────────────────────────

export async function onRequestGet(context: {
  data: { ctx: RequestContext; env: Env };
}) {
  const { data } = context;
  const { ctx, env } = data;

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: consents, error } = await adminClient
    .from('gdpr_consents')
    .select('consent_type, version, given, given_at, revoked_at')
    .eq('user_id', ctx.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return jsonResponse({ success: false, error: 'Errore.' }, 500);
  }

  // Get latest consent per type
  const latestConsents: Record<string, unknown> = {};
  for (const c of consents || []) {
    if (!latestConsents[c.consent_type as string]) {
      latestConsents[c.consent_type as string] = c;
    }
  }

  return jsonResponse({
    success: true,
    data: Object.values(latestConsents),
  });
}

// ── POST /api/gdpr/consents ──────────────────────────────────────────────────

export async function onRequestPost(context: {
  request: Request;
  data: { ctx: RequestContext; env: Env };
}) {
  const { request, data } = context;
  const { ctx, env } = data;

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  let body: { consent_type?: ConsentType; given?: boolean };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  const validTypes: ConsentType[] = [
    'privacy_policy', 'health_data_processing', 'electronic_delivery',
    'email_notifications', 'sms_notifications', 'marketing',
  ];

  if (!body.consent_type || !validTypes.includes(body.consent_type)) {
    return jsonResponse({ success: false, error: 'Tipo di consenso non valido.' }, 400);
  }

  if (body.given === undefined) {
    return jsonResponse({ success: false, error: 'Specificare given: true/false.' }, 400);
  }

  // Prevent revoking mandatory consents
  const mandatoryConsents: ConsentType[] = ['privacy_policy', 'health_data_processing', 'electronic_delivery'];
  if (mandatoryConsents.includes(body.consent_type) && !body.given) {
    return jsonResponse({
      success: false,
      error: 'Non è possibile revocare i consensi obbligatori. Per procedere, eliminare il proprio account.',
    }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Insert new consent record (versioned, immutable)
  await adminClient.from('gdpr_consents').insert({
    user_id: ctx.user.id,
    consent_type: body.consent_type,
    version: '1.0',
    given: body.given,
    given_at: body.given ? new Date().toISOString() : null,
    revoked_at: !body.given ? new Date().toISOString() : null,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
  });

  // Audit log
  await adminClient.from('audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: body.given ? 'gdpr_consent_given' : 'gdpr_consent_revoked',
    target_type: 'consent',
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: { consent_type: body.consent_type, given: body.given },
    risk_level: 'medium',
  });

  return jsonResponse({ success: true });
}

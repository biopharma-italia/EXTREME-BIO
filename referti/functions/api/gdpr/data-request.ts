/**
 * ============================================================================
 * POST /api/gdpr/data-request — Submit GDPR data request
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_middleware';
import { sanitizeInput } from '../../../src/lib/validators';
import type { RequestContext, GdprRequestType } from '../../../src/lib/types';

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

  if (!ctx.user) {
    return jsonResponse({ success: false, error: 'Autenticazione richiesta.' }, 401);
  }

  let body: { type?: GdprRequestType; description?: string };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: 'Richiesta non valida.' }, 400);
  }

  const validTypes: GdprRequestType[] = ['access', 'rectification', 'erasure', 'portability', 'restriction'];
  if (!body.type || !validTypes.includes(body.type)) {
    return jsonResponse({ success: false, error: 'Tipo richiesta non valido.' }, 400);
  }

  const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check for existing pending request of same type
  const { data: existing } = await adminClient
    .from('gdpr_data_requests')
    .select('id')
    .eq('user_id', ctx.user.id)
    .eq('request_type', body.type)
    .in('status', ['pending', 'processing'])
    .maybeSingle();

  if (existing) {
    return jsonResponse({
      success: false,
      error: 'Esiste già una richiesta in corso dello stesso tipo.',
    }, 409);
  }

  const deadline = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

  const { data: gdprRequest, error } = await adminClient
    .from('gdpr_data_requests')
    .insert({
      user_id: ctx.user.id,
      request_type: body.type,
      status: 'pending',
      description: body.description ? sanitizeInput(body.description, 2000) : null,
      deadline,
    })
    .select('id, deadline')
    .single();

  if (error) {
    return jsonResponse({ success: false, error: 'Errore nella creazione della richiesta.' }, 500);
  }

  // Audit log
  await adminClient.from('audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: body.type === 'erasure' ? 'gdpr_data_delete' : 'gdpr_data_export',
    target_type: 'gdpr_request',
    target_id: gdprRequest.id,
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: { request_type: body.type, deadline },
    risk_level: body.type === 'erasure' ? 'high' : 'medium',
  });

  return jsonResponse({
    success: true,
    request_id: gdprRequest.id,
    deadline,
    message: 'La sua richiesta sarà elaborata entro 30 giorni.',
  }, 201);
}

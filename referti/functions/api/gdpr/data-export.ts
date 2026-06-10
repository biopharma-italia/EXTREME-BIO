/**
 * ============================================================================
 * GET /api/gdpr/data-export — Download personal data export
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { jsonResponse } from '../_middleware';
import type { RequestContext } from '../../../src/lib/types';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

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

  // Collect all user data
  const [
    { data: profile },
    { data: consents },
    { data: reports },
    { data: notifications },
    { data: auditLogs },
  ] = await Promise.all([
    adminClient.from('users').select('*').eq('id', ctx.user.id).single(),
    adminClient.from('gdpr_consents').select('*').eq('user_id', ctx.user.id),
    adminClient.from('reports').select('*').eq('patient_id', ctx.user.id).is('deleted_at', null),
    adminClient.from('notifications').select('*').eq('user_id', ctx.user.id),
    adminClient.from('audit_log').select('*').eq('user_id', ctx.user.id).order('created_at', { ascending: false }).limit(1000),
  ]);

  // P1-6: Use explicit field whitelist to prevent leaking internal fields
  const exportData = {
    export_date: new Date().toISOString(),
    export_version: '1.1',
    personal_data: profile ? {
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      fiscal_code: profile.fiscal_code,
      phone: profile.phone,
      date_of_birth: profile.date_of_birth,
      gender: profile.gender,
      role: profile.role,
      language: profile.language,
      timezone: profile.timezone,
      is_email_verified: profile.is_email_verified,
      preferred_notification_channel: profile.preferred_notification_channel,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    } : null,
    consents: consents || [],
    reports: (reports || []).map((r: Record<string, unknown>) => ({
      report_number: r.report_number,
      report_type: r.report_type,
      category: r.category,
      sample_date: r.sample_date,
      status: r.status,
      created_at: r.created_at,
      released_at: r.released_at,
    })),
    notifications: (notifications || []).map((n: Record<string, unknown>) => ({
      channel: n.channel,
      subject: n.subject,
      status: n.status,
      created_at: n.created_at,
    })),
    audit_log: (auditLogs || []).map((a: Record<string, unknown>) => ({
      action: a.action,
      target_type: a.target_type,
      created_at: a.created_at,
      details: a.details,
    })),
  };

  // Audit log
  await adminClient.from('audit_log').insert({
    user_id: ctx.user.id,
    user_role: ctx.user.role,
    action: 'gdpr_data_export',
    ip_address: ctx.ip,
    user_agent: ctx.userAgent,
    request_id: ctx.requestId,
    details: { format: 'json' },
    risk_level: 'medium',
  });

  const today = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="bio-clinic-dati-personali-${today}.json"`,
      'Cache-Control': 'no-store',
    },
  });
}

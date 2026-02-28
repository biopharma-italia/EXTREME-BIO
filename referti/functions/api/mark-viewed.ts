/**
 * POST /api/mark-viewed
 * Marks a report as viewed by the patient.
 * Called when patient opens report details or downloads.
 *
 * Body: { report_id: string }
 *
 * @version 2.1.0 — P0-4 UUID validation
 */

// P0-4: UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  APP_URL: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.APP_URL || 'https://referti.bio-clinic.it',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers: corsHeaders });
    }

    const body = await request.json() as { report_id: string };
    if (!body.report_id) {
      return new Response(JSON.stringify({ error: 'report_id mancante' }), { status: 400, headers: corsHeaders });
    }

    // P0-4: Validate UUID format to prevent injection
    if (!UUID_REGEX.test(body.report_id)) {
      return new Response(JSON.stringify({ error: 'report_id non valido' }), { status: 400, headers: corsHeaders });
    }

    const sbUrl = env.SUPABASE_URL || 'https://mdxqgzkxrcrotxxbhoai.supabase.co';
    const sbKey = env.SUPABASE_SERVICE_KEY;

    if (!sbKey) {
      return new Response(JSON.stringify({ error: 'Server non configurato' }), { status: 500, headers: corsHeaders });
    }

    // Verify user via Supabase
    const userResp = await fetch(`${sbUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': sbKey },
    });
    if (!userResp.ok) {
      return new Response(JSON.stringify({ error: 'Token non valido' }), { status: 401, headers: corsHeaders });
    }
    const authUser = await userResp.json() as { id: string };

    // Get user profile
    const profileResp = await fetch(
      `${sbUrl}/rest/v1/users?auth_id=eq.${authUser.id}&select=id,role&limit=1`,
      { headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` } }
    );
    const profiles = await profileResp.json() as { id: string; role: string }[];
    if (!profiles.length) {
      return new Response(JSON.stringify({ error: 'Profilo non trovato' }), { status: 404, headers: corsHeaders });
    }

    // Verify report belongs to patient
    const reportResp = await fetch(
      `${sbUrl}/rest/v1/reports?id=eq.${body.report_id}&select=id,patient_id,patient_viewed`,
      { headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` } }
    );
    const reports = await reportResp.json() as any[];
    if (!reports.length) {
      return new Response(JSON.stringify({ error: 'Referto non trovato' }), { status: 404, headers: corsHeaders });
    }

    const report = reports[0];

    // Only the patient (or admin) can mark as viewed
    if (profiles[0].role === 'patient' && report.patient_id !== profiles[0].id) {
      return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 403, headers: corsHeaders });
    }

    // Only mark if not already viewed
    if (!report.patient_viewed) {
      await fetch(`${sbUrl}/rest/v1/reports?id=eq.${body.report_id}`, {
        method: 'PATCH',
        headers: {
          'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          patient_viewed: true,
          patient_viewed_at: new Date().toISOString(),
        }),
      });
    }

    return new Response(JSON.stringify({
      success: true,
      already_viewed: report.patient_viewed,
    }), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error('[mark-viewed] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Errore interno' }), { status: 500, headers: corsHeaders });
  }
};

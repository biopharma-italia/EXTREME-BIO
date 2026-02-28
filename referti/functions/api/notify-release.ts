/**
 * POST /api/notify-release
 * Sends email notification to patient when a report is released.
 * Called by dashboard.js after successful release.
 *
 * Body: { report_id: string }
 * Env:  SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY, APP_URL
 *
 * @version 2.1.0 — P0-4 UUID validation, P1-6 idempotency check
 */

// P0-4: UUID v4 validation regex
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  RESEND_API_KEY: string;
  APP_URL: string;
  EMAIL_FROM: string;
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
    // Verify authorization - extract JWT from header
    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return new Response(JSON.stringify({ error: 'Non autorizzato' }), { status: 401, headers: corsHeaders });
    }

    // Parse request
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
      console.error('[notify-release] Missing SUPABASE_SERVICE_KEY');
      return new Response(JSON.stringify({ error: 'Server non configurato' }), { status: 500, headers: corsHeaders });
    }

    // Verify caller is admin by decoding token via Supabase
    const userResp = await fetch(`${sbUrl}/auth/v1/user`, {
      headers: { 'Authorization': `Bearer ${token}`, 'apikey': sbKey },
    });
    if (!userResp.ok) {
      return new Response(JSON.stringify({ error: 'Token non valido' }), { status: 401, headers: corsHeaders });
    }
    const authUser = await userResp.json() as { id: string };

    // Get user profile and check role
    const profileResp = await fetch(
      `${sbUrl}/rest/v1/users?auth_id=eq.${authUser.id}&select=id,role&limit=1`,
      { headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` } }
    );
    const profiles = await profileResp.json() as { id: string; role: string }[];
    if (!profiles.length || !['admin', 'super_admin', 'lab_technician', 'physician', 'ostetrica'].includes(profiles[0].role)) {
      return new Response(JSON.stringify({ error: 'Ruolo non autorizzato' }), { status: 403, headers: corsHeaders });
    }

    // Get report + patient
    const reportResp = await fetch(
      `${sbUrl}/rest/v1/reports?id=eq.${body.report_id}&select=id,report_number,report_type,sample_date,status,patient_id,patient_notified`,
      { headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` } }
    );
    const reports = await reportResp.json() as any[];
    if (!reports.length) {
      return new Response(JSON.stringify({ error: 'Referto non trovato' }), { status: 404, headers: corsHeaders });
    }
    const report = reports[0];

    if (report.status !== 'released') {
      return new Response(JSON.stringify({ error: 'Il referto non è rilasciato' }), { status: 400, headers: corsHeaders });
    }

    // P1-6: Idempotency check — don't re-send if already notified
    if (report.patient_notified) {
      return new Response(JSON.stringify({
        success: true,
        already_notified: true,
        email_sent: false,
        report_number: report.report_number,
      }), { status: 200, headers: corsHeaders });
    }

    // Get patient
    const patientResp = await fetch(
      `${sbUrl}/rest/v1/users?id=eq.${report.patient_id}&select=id,email,first_name,last_name`,
      { headers: { 'apikey': sbKey, 'Authorization': `Bearer ${sbKey}` } }
    );
    const patients = await patientResp.json() as any[];
    if (!patients.length || !patients[0].email) {
      return new Response(JSON.stringify({ error: 'Paziente senza email', sent: false }), { status: 200, headers: corsHeaders });
    }
    const patient = patients[0];

    // Mark report as notified
    await fetch(`${sbUrl}/rest/v1/reports?id=eq.${body.report_id}`, {
      method: 'PATCH',
      headers: {
        'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`,
        'Content-Type': 'application/json', 'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        patient_notified: true,
        patient_notified_at: new Date().toISOString(),
      }),
    });

    // Queue in-app notification
    await fetch(`${sbUrl}/rest/v1/notifications`, {
      method: 'POST',
      headers: {
        'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`,
        'Content-Type': 'application/json', 'Prefer': 'return=minimal',
      },
      body: JSON.stringify({
        user_id: patient.id,
        channel: 'in_app',
        subject: 'Nuovo referto disponibile',
        body: `Gentile ${patient.first_name}, il suo referto ${report.report_type} del ${report.sample_date} è disponibile.`,
        report_id: body.report_id,
        action_url: `/dashboard/#my-reports`,
        status: 'sent',
        sent_at: new Date().toISOString(),
      }),
    });

    // Send email via Resend
    const appUrl = env.APP_URL || 'https://referti.bio-clinic.it';
    const emailFrom = env.EMAIL_FROM || 'Bio-Clinic Referti <referti@bio-clinic.it>';
    let emailSent = false;

    console.log('[notify-release] Email check — RESEND_API_KEY:', env.RESEND_API_KEY ? `set (${env.RESEND_API_KEY.substring(0, 6)}...)` : 'NOT SET', '| patient:', patient.email);

    if (env.RESEND_API_KEY) {
      try {
        const emailResp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: emailFrom,
            to: patient.email,
            subject: `Referto disponibile — ${report.report_number}`,
            html: `
<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f7f9fc;padding:20px">
  <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.06)">
    <div style="text-align:center;margin-bottom:24px">
      <div style="background:#00704A;color:white;display:inline-block;padding:8px 20px;border-radius:8px;font-size:18px;font-weight:600">
        Bio-Clinic Sassari
      </div>
    </div>
    <h2 style="color:#1a1a2e;margin:0 0 16px">Nuovo referto disponibile</h2>
    <p style="color:#444;line-height:1.6">
      Gentile <strong>${patient.first_name} ${patient.last_name}</strong>,
    </p>
    <p style="color:#444;line-height:1.6">
      Le comunichiamo che il suo referto è ora disponibile per la consultazione e il download.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px">
      <tr style="background:#f0faf5">
        <td style="padding:10px 14px;font-weight:600;color:#555;border:1px solid #e0e0e0">N. Referto</td>
        <td style="padding:10px 14px;border:1px solid #e0e0e0"><strong>${report.report_number}</strong></td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-weight:600;color:#555;border:1px solid #e0e0e0">Tipo Esame</td>
        <td style="padding:10px 14px;border:1px solid #e0e0e0">${report.report_type || '--'}</td>
      </tr>
      <tr style="background:#f0faf5">
        <td style="padding:10px 14px;font-weight:600;color:#555;border:1px solid #e0e0e0">Data Prelievo</td>
        <td style="padding:10px 14px;border:1px solid #e0e0e0">${report.sample_date || '--'}</td>
      </tr>
    </table>
    <div style="text-align:center;margin:28px 0">
      <a href="${appUrl}/dashboard/"
         style="background:#00704A;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px">
        Visualizza e Scarica Referto
      </a>
    </div>
    <p style="color:#888;font-size:12px;line-height:1.5;margin-top:24px;border-top:1px solid #eee;padding-top:16px">
      Questo messaggio è stato inviato automaticamente dal sistema Referti Online di Bio-Clinic Sassari.<br>
      Per assistenza: <a href="mailto:gestione@bio-clinic.it" style="color:#00704A">gestione@bio-clinic.it</a>
    </p>
  </div>
</body>
</html>`,
          }),
        });

        emailSent = emailResp.ok;

        // Queue email notification record
        await fetch(`${sbUrl}/rest/v1/notifications`, {
          method: 'POST',
          headers: {
            'apikey': sbKey, 'Authorization': `Bearer ${sbKey}`,
            'Content-Type': 'application/json', 'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            user_id: patient.id,
            channel: 'email',
            subject: `Referto disponibile — ${report.report_number}`,
            body: `Il suo referto ${report.report_type} del ${report.sample_date} è disponibile.`,
            body_html: '<p>Email inviata con successo</p>',
            report_id: body.report_id,
            action_url: `${appUrl}/dashboard/`,
            status: emailSent ? 'sent' : 'failed',
            provider: 'resend',
            sent_at: emailSent ? new Date().toISOString() : null,
          }),
        });
      } catch (err) {
        console.error('[notify-release] Resend error:', err);
      }
    } else {
      console.warn('[notify-release] RESEND_API_KEY not configured');
    }

    return new Response(JSON.stringify({
      success: true,
      email_sent: emailSent,
      patient_email: patient.email,
      report_number: report.report_number,
    }), { status: 200, headers: corsHeaders });

  } catch (err: any) {
    console.error('[notify-release] Error:', err);
    return new Response(JSON.stringify({ error: err.message || 'Errore interno' }), { status: 500, headers: corsHeaders });
  }
};

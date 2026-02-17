/**
 * ============================================================================
 * BIO-CLINIC CONTACT API - Cloudflare Pages Function
 * ============================================================================
 * 
 * Path: /api/contact (POST)
 * 
 * Handles form submissions from:
 *   - /contatti/ contact form
 *   - CGE micro-forms on specialty/service pages
 * 
 * Flow:
 *   1. Validate input (name, phone required)
 *   2. Generate lead_id
 *   3. Store in KV (if available) or forward via email
 *   4. Send notification email via Resend/SendGrid/Brevo
 *   5. Return lead_id for GA4 attribution
 * 
 * Environment variables (set in CF Pages dashboard):
 *   - CONTACT_EMAIL: destination email (e.g., info@bio-clinic.it)
 *   - EMAIL_API_KEY: Resend/SendGrid API key
 *   - LEADS_KV: KV namespace binding for lead storage
 *   - ALLOWED_ORIGINS: comma-separated allowed origins
 * 
 * @version 1.0.0
 * @date 2026-02-16
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || 'https://bio-clinic.it',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  try {
    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.phone) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nome e telefono sono obbligatori.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Sanitize inputs
    const sanitize = (str) => (str || '').toString().trim().substring(0, 500)
      .replace(/[<>]/g, '');

    const lead = {
      lead_id: 'bc_lead_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6),
      name: sanitize(body.name),
      phone: sanitize(body.phone),
      email: sanitize(body.email || ''),
      message: sanitize(body.message || ''),
      service: sanitize(body.service || ''),
      specialty: sanitize(body.specialty || body.bc_specialty || ''),
      physician: sanitize(body.physician || body.bc_physician_name || ''),
      source_page: sanitize(body.source_page || body.bc_page_path || ''),
      bc_user_id: sanitize(body.bc_user_id || ''),
      bc_session_id: sanitize(body.bc_session_id || ''),
      bc_device_type: sanitize(body.bc_device_type || ''),
      referrer: sanitize(body.bc_referrer || ''),
      timestamp: new Date().toISOString(),
      ip_country: request.cf?.country || 'unknown',
      ip_city: request.cf?.city || 'unknown',
    };

    // Store lead in KV if available
    if (env.LEADS_KV) {
      try {
        await env.LEADS_KV.put(
          lead.lead_id,
          JSON.stringify(lead),
          { expirationTtl: 60 * 60 * 24 * 365 } // 1 year
        );
      } catch (kvError) {
        console.error('KV storage error:', kvError);
      }
    }

    // Send notification email via Resend
    if (env.EMAIL_API_KEY && env.CONTACT_EMAIL) {
      try {
        const emailBody = buildEmailBody(lead);
        await sendEmail(env, lead, emailBody);
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Success response
    return new Response(JSON.stringify({
      success: true,
      lead_id: lead.lead_id,
      message: 'Richiesta ricevuta. Ti contatteremo presto.'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Contact API error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'Si è verificato un errore. Riprova o chiamaci al 079 956 1332.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}

// Handle CORS preflight
export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': context.env.ALLOWED_ORIGINS || 'https://bio-clinic.it',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}

function buildEmailBody(lead) {
  const specialtyLabel = lead.specialty && lead.specialty !== 'none'
    ? lead.specialty.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Non specificata';

  const serviceLabel = lead.service && lead.service !== 'none' && lead.service !== ''
    ? lead.service.replace(/-/g, ' ').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : 'Non specificato';

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #00704A; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">Nuova Richiesta - Bio-Clinic</h2>
        <p style="margin: 5px 0 0; opacity: 0.9;">ID: ${lead.lead_id}</p>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; width: 140px;">Nome:</td><td>${lead.name}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Telefono:</td><td><a href="tel:${lead.phone}">${lead.phone}</a></td></tr>
          ${lead.email ? `<tr><td style="padding: 8px 0; font-weight: bold;">Email:</td><td><a href="mailto:${lead.email}">${lead.email}</a></td></tr>` : ''}
          <tr><td style="padding: 8px 0; font-weight: bold;">Specialita:</td><td>${specialtyLabel}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Servizio:</td><td>${serviceLabel}</td></tr>
          ${lead.physician && lead.physician !== 'none' ? `<tr><td style="padding: 8px 0; font-weight: bold;">Medico:</td><td>${lead.physician.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</td></tr>` : ''}
          ${lead.message ? `<tr><td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Messaggio:</td><td>${lead.message}</td></tr>` : ''}
        </table>
        <hr style="margin: 16px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
          Pagina: ${lead.source_page || 'N/D'}<br>
          Dispositivo: ${lead.bc_device_type || 'N/D'}<br>
          Localita: ${lead.ip_city}, ${lead.ip_country}<br>
          Data: ${new Date(lead.timestamp).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}
        </p>
      </div>
    </div>
  `;
}

async function sendEmail(env, lead, htmlBody) {
  // Resend API
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Bio-Clinic CGE <noreply@bio-clinic.it>',
      to: [env.CONTACT_EMAIL],
      subject: `Nuova richiesta: ${lead.specialty !== 'none' ? lead.specialty.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Contatto'} - ${lead.name}`,
      html: htmlBody,
      tags: [
        { name: 'lead_id', value: lead.lead_id },
        { name: 'specialty', value: lead.specialty || 'general' },
        { name: 'source', value: 'cge_form' }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${response.status} ${error}`);
  }
}

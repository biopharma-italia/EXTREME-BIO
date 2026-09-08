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
 * @version 1.1.0 — 2026-09-08
 *   Fix audit 2026-09-07:
 *   - P1.2: niente più success:true se il lead NON è stato salvato né
 *     recapitato (prima gli errori D1/Resend erano inghiottiti in silenzio
 *     e il paziente credeva di aver contattato la clinica).
 *   - P1.2: rate limit basico per IP (10 invii/ora via KV).
 *   - P1.3: CORS con origin singolo da whitelist + Vary: Origin.
 */

import { corsHeadersFor } from '../lib/cors.js';

const RATE_LIMIT_PER_HOUR = 10;

async function checkRateLimit(env, ip) {
  // Best-effort (KV get+put non atomico: tollerabile per anti-spam)
  if (!env.BOOKING_KV || !ip || ip === 'unknown') return true;
  try {
    const key = `rl:contact:${ip}`;
    const current = parseInt(await env.BOOKING_KV.get(key)) || 0;
    if (current >= RATE_LIMIT_PER_HOUR) return false;
    await env.BOOKING_KV.put(key, String(current + 1), { expirationTtl: 3600 });
  } catch { /* mai bloccare un paziente per un errore del rate limiter */ }
  return true;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers (P1.3: origin singolo valido, non lista)
  const corsHeaders = {
    ...corsHeadersFor(request, env, 'POST, OPTIONS', 'Content-Type'),
    'Access-Control-Max-Age': '86400',
  };

  try {
    // Rate limit per IP (P1.2)
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (!(await checkRateLimit(env, clientIP))) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Troppe richieste. Attendi qualche minuto o chiamaci al 079 956 1332.'
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '600' }
      });
    }

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

    // Esiti reali di persistenza/recapito (P1.2: niente successi finti)
    let storedD1 = false;
    let storedKV = false;
    let emailed = false;

    // Store lead in D1 database (primary storage)
    if (env.BOOKING_DB) {
      try {
        const now = new Date().toISOString();
        await env.BOOKING_DB.prepare(
          `INSERT INTO contacts (id, lead_id, name, phone, email, message, service, specialty, physician, source_page, utm_source, utm_medium, utm_campaign, bc_user_id, bc_session_id, bc_device_type, referrer, ip_country, ip_city, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)`
        ).bind(
          lead.lead_id, lead.lead_id, lead.name, lead.phone, lead.email,
          lead.message, lead.service, lead.specialty, lead.physician,
          lead.source_page,
          sanitize(body.utm_source || ''), sanitize(body.utm_medium || ''), sanitize(body.utm_campaign || ''),
          lead.bc_user_id, lead.bc_session_id, lead.bc_device_type, lead.referrer,
          lead.ip_country, lead.ip_city, now, now
        ).run();
        storedD1 = true;
      } catch (dbError) {
        console.error('D1 storage error:', dbError);
      }
    }

    // Fallback: store in KV if D1 unavailable OR D1 write failed
    if (!storedD1 && env.BOOKING_KV) {
      try {
        await env.BOOKING_KV.put(
          `lead:${lead.lead_id}`,
          JSON.stringify(lead),
          { expirationTtl: 60 * 60 * 24 * 365 }
        );
        storedKV = true;
      } catch (kvError) {
        console.error('KV storage error:', kvError);
      }
    }

    // Send notification email via Resend
    if (env.EMAIL_API_KEY && env.CONTACT_EMAIL) {
      try {
        const emailBody = buildEmailBody(lead);
        await sendEmail(env, lead, emailBody);
        emailed = true;
      } catch (emailError) {
        console.error('Email send error:', emailError);
        // Non fallire la richiesta se l'email fallisce MA il lead è salvato
      }
    }

    // P1.2: successo SOLO se il lead è stato salvato (D1/KV) o recapitato via
    // email. Se tutti i canali falliscono, il paziente deve saperlo subito.
    const delivered = storedD1 || storedKV || emailed;
    if (!delivered) {
      console.error('Contact lead LOST (no storage, no email):', lead.lead_id);
      return new Response(JSON.stringify({
        success: false,
        error: 'Non siamo riusciti a registrare la richiesta. Riprova tra qualche minuto o chiamaci al 079 956 1332.'
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '120' }
      });
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
      ...corsHeadersFor(context.request, context.env, 'POST, OPTIONS', 'Content-Type'),
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

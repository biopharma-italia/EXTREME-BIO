/**
 * ============================================================================
 * BIO-CLINIC SERVER-SIDE TAGGING PROXY - Cloudflare Worker
 * ============================================================================
 * 
 * PHASE 2 IMPLEMENTATION
 * 
 * Architecture:
 *   Browser -> GTM Web Container -> This Worker -> GA4 Measurement Protocol
 * 
 * Benefits:
 *   - EU data routing (Cloudflare EU data centers)
 *   - Ad-blocker bypass (first-party domain)
 *   - Data enrichment before GA4 (add server-side context)
 *   - PII stripping (remove raw email/phone before GA4)
 *   - Offline conversion import preparation
 * 
 * Deployment: 
 *   Deploy as Cloudflare Worker on subdomain: track.bio-clinic.it
 *   Or as Pages Function at: /api/collect
 * 
 * Required ENV vars:
 *   - GA4_MEASUREMENT_ID: G-9EXCL016VJ
 *   - GA4_API_SECRET: (from GA4 Admin > Data Streams > Measurement Protocol)
 *   - LEADS_KV: KV namespace for offline conversion matching
 * 
 * Set these in Cloudflare Pages Dashboard:
 *   Settings > Environment Variables > Production
 * 
 * @version 1.0.0
 * @date 2026-02-16
 */

const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

export default {
  async fetch(request, env, ctx) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'https://bio-clinic.it',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json();

      // Validate required fields
      if (!body.client_id || !body.events || !Array.isArray(body.events)) {
        return new Response(JSON.stringify({ error: 'Invalid payload' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Enrich events with server-side context
      const enrichedEvents = body.events.map(event => {
        const params = event.params || {};

        // Add server-side context
        params.bc_server_timestamp = new Date().toISOString();
        params.bc_geo_country = request.cf?.country || 'unknown';
        params.bc_geo_city = request.cf?.city || 'unknown';
        params.bc_geo_region = request.cf?.region || 'unknown';
        params.bc_colo = request.cf?.colo || 'unknown'; // CF data center
        params.bc_is_eu = isEU(request.cf?.country) ? 'true' : 'false';

        // Strip PII - keep only hashed versions
        delete params.bc_raw_email;
        delete params.bc_raw_phone;

        return { name: event.name, params };
      });

      // Build GA4 Measurement Protocol payload
      const ga4Payload = {
        client_id: body.client_id,
        user_id: body.user_id || undefined,
        events: enrichedEvents,
        user_properties: body.user_properties || undefined,
      };

      // Forward to GA4
      const ga4Url = `${GA4_ENDPOINT}?measurement_id=${env.GA4_MEASUREMENT_ID || 'G-9EXCL016VJ'}&api_secret=${env.GA4_API_SECRET || ''}`;

      const ga4Response = await fetch(ga4Url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ga4Payload)
      });

      // Store conversion events in KV for offline matching
      if (env.LEADS_KV) {
        for (const event of enrichedEvents) {
          if (event.name === 'bc_form_submit' || event.name === 'bc_lead_generated') {
            const key = `conversion_${body.client_id}_${Date.now()}`;
            ctx.waitUntil(
              env.LEADS_KV.put(key, JSON.stringify({
                client_id: body.client_id,
                user_id: body.user_id,
                event: event.name,
                params: event.params,
                timestamp: new Date().toISOString()
              }), { expirationTtl: 60 * 60 * 24 * 90 }) // 90 days
            );
          }
        }
      }

      return new Response(JSON.stringify({
        status: 'ok',
        forwarded: enrichedEvents.length,
        ga4_status: ga4Response.status
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': 'https://bio-clinic.it',
        }
      });

    } catch (error) {
      console.error('SST Proxy error:', error);
      return new Response(JSON.stringify({ error: 'Internal error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

function isEU(country) {
  const euCountries = [
    'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR',
    'DE','GR','HU','IE','IT','LV','LT','LU','MT','NL',
    'PL','PT','RO','SK','SI','ES','SE',
    'IS','LI','NO' // EEA
  ];
  return euCountries.includes(country);
}

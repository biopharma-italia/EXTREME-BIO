/**
 * ============================================================================
 * BIO-CLINIC LABORATORY BOOKING API — Services List
 * ============================================================================
 *
 * Route: GET /api/booking/services
 *
 * Returns all active bookable laboratory services.
 * Data source: D1 database (services table) → static fallback.
 *
 * Response: { success, department, services[], count }
 *
 * @version 2.0.0
 * @date 2026-02-17
 */

import { FALLBACK_SERVICES } from './_services-data.js';

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGINS || 'https://bio-clinic.it',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function onRequestGet(context) {
  const { env } = context;
  const headers = {
    ...corsHeaders(env),
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300, s-maxage=600',
  };

  try {
    let services;
    let source = 'static';

    // Try D1 first
    if (env.BOOKING_DB) {
      try {
        const result = await env.BOOKING_DB.prepare(
          `SELECT id, name, slug, category, duration_minutes, price_eur,
                  requires_fasting, prep_instructions, max_per_slot, sort_order
           FROM services
           WHERE active = 1 AND department = 'laboratorio'
           ORDER BY sort_order ASC, category ASC, name ASC`
        ).all();
        services = result.results.map(s => ({
          ...s,
          requires_fasting: !!s.requires_fasting
        }));
        source = 'd1';
      } catch (dbErr) {
        console.error('[BookingAPI] D1 query failed, using fallback:', dbErr.message);
      }
    }

    // Fallback to static data
    if (!services) {
      services = FALLBACK_SERVICES
        .filter(s => s.active !== false)
        .sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99));
    }

    return new Response(JSON.stringify({
      success: true,
      department: 'laboratorio',
      services,
      count: services.length,
      _source: source
    }), { status: 200, headers });

  } catch (err) {
    console.error('[BookingAPI] Services error:', err);
    const services = FALLBACK_SERVICES.filter(s => s.active !== false);
    return new Response(JSON.stringify({
      success: true,
      department: 'laboratorio',
      services,
      count: services.length,
      _source: 'fallback'
    }), { status: 200, headers });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(context.env),
      'Access-Control-Max-Age': '86400',
    }
  });
}

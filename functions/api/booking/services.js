/**
 * Lab Booking Services — Static fallback data
 * Bio-Clinic Sassari — Laboratorio Analisi
 * 
 * Used when D1 database is not yet bound.
 * Matches D1 schema: services table
 * 
 * @version 1.1.0
 * @date 2026-02-17
 */
const FALLBACK_SERVICES = [
  {
    id: "prelievo-standard",
    name: "Prelievo Ematico Standard",
    slug: "prelievo-standard",
    category: "prelievo",
    duration_minutes: 15,
    price_eur: 5.00,
    requires_fasting: true,
    prep_instructions: "Presentarsi a digiuno da almeno 8 ore. Bere solo acqua.",
    max_per_slot: 3,
    sort_order: 1,
    active: true
  },
  {
    id: "prelievo-urgente",
    name: "Prelievo Ematico Urgente",
    slug: "prelievo-urgente",
    category: "prelievo",
    duration_minutes: 15,
    price_eur: 15.00,
    requires_fasting: true,
    prep_instructions: "Presentarsi a digiuno da almeno 8 ore. Bere solo acqua. Referto in giornata.",
    max_per_slot: 3,
    sort_order: 2,
    active: true
  },
  {
    id: "urine-standard",
    name: "Esame Urine Completo",
    slug: "urine-standard",
    category: "urine",
    duration_minutes: 10,
    price_eur: 8.00,
    requires_fasting: false,
    prep_instructions: "Portare campione di urina del mattino (mitto intermedio) in contenitore sterile.",
    max_per_slot: 3,
    sort_order: 3,
    active: true
  },
  {
    id: "tampone-vaginale",
    name: "Tampone Vaginale / Cervicale",
    slug: "tampone-vaginale",
    category: "microbiologia",
    duration_minutes: 20,
    price_eur: 25.00,
    requires_fasting: false,
    prep_instructions: "Non effettuare lavande vaginali nelle 24h precedenti. Non usare ovuli o creme vaginali per 5 giorni prima.",
    max_per_slot: 3,
    sort_order: 10,
    active: true
  },
  {
    id: "tampone-faringeo",
    name: "Tampone Faringeo",
    slug: "tampone-faringeo",
    category: "microbiologia",
    duration_minutes: 10,
    price_eur: 20.00,
    requires_fasting: true,
    prep_instructions: "Presentarsi a digiuno. Non usare collutorio. Non assumere antibiotici nelle 48h precedenti.",
    max_per_slot: 3,
    sort_order: 11,
    active: true
  },
  {
    id: "profilo-tiroide",
    name: "Profilo Tiroideo Completo (TSH, FT3, FT4)",
    slug: "profilo-tiroide",
    category: "profilo",
    duration_minutes: 15,
    price_eur: 35.00,
    requires_fasting: false,
    prep_instructions: "Non richiede digiuno. Comunicare eventuali farmaci tiroidei assunti.",
    max_per_slot: 3,
    sort_order: 20,
    active: true
  },
  {
    id: "profilo-ormonale-donna",
    name: "Profilo Ormonale Donna",
    slug: "profilo-ormonale-donna",
    category: "profilo",
    duration_minutes: 15,
    price_eur: 65.00,
    requires_fasting: true,
    prep_instructions: "Digiuno da 8 ore. Eseguire al 3\u00b0-5\u00b0 giorno del ciclo, salvo diversa indicazione medica.",
    max_per_slot: 3,
    sort_order: 21,
    active: true
  },
  {
    id: "marcatori-tumorali",
    name: "Pannello Marcatori Tumorali",
    slug: "marcatori-tumorali",
    category: "profilo",
    duration_minutes: 15,
    price_eur: 80.00,
    requires_fasting: true,
    prep_instructions: "Digiuno da 8 ore. Include: PSA, CEA, CA 19-9, CA 125, AFP.",
    max_per_slot: 3,
    sort_order: 22,
    active: true
  },
  {
    id: "test-hpv",
    name: "HPV DNA Test",
    slug: "test-hpv",
    category: "microbiologia",
    duration_minutes: 20,
    price_eur: 55.00,
    requires_fasting: false,
    prep_instructions: "Non durante mestruazioni. Astenersi da rapporti sessuali 48h prima.",
    max_per_slot: 3,
    sort_order: 12,
    active: true
  },
  {
    id: "test-allergologico",
    name: "Pannello Allergologico (IgE Specifiche)",
    slug: "test-allergologico",
    category: "allergologia",
    duration_minutes: 15,
    price_eur: 45.00,
    requires_fasting: false,
    prep_instructions: "Non richiede digiuno. Comunicare antistaminici assunti (non sospendere senza indicazione medica).",
    max_per_slot: 3,
    sort_order: 30,
    active: true
  },
  {
    id: "glicemia-curva",
    name: "Curva Glicemica da Carico (OGTT)",
    slug: "glicemia-curva",
    category: "profilo",
    duration_minutes: 120,
    price_eur: 25.00,
    requires_fasting: true,
    prep_instructions: "Digiuno da 10-12 ore. Il test richiede circa 2 ore con prelievi multipli. Non fumare durante il test.",
    max_per_slot: 3,
    sort_order: 23,
    active: true
  },
  {
    id: "emocromo-completo",
    name: "Emocromo Completo con Formula",
    slug: "emocromo-completo",
    category: "prelievo",
    duration_minutes: 15,
    price_eur: 8.00,
    requires_fasting: false,
    prep_instructions: "Non richiede digiuno. Comunicare eventuali terapie in corso.",
    max_per_slot: 3,
    sort_order: 4,
    active: true
  }
];


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

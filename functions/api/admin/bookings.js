/**
 * Bio-Clinic Admin API — Bookings Management
 * GET/PATCH /api/admin/bookings
 * =============================================
 * Reads booking data from D1 (primary) or Supabase bookings_sync (fallback).
 * Supports listing, filtering by date/status, search, and status updates.
 *
 * Data sources:
 *   1. D1 database (BOOKING_DB) — bookings table (real-time, written by /api/booking/confirm)
 *   2. Supabase (bookings_sync) — synced copy (fallback when D1 is unavailable)
 *
 * @version 1.0.0
 * @date 2026-03-12
 */

// ============================================================================
// CORS
// ============================================================================

const ADMIN_ORIGINS = [
  'https://admin.bio-clinic.it',
  'https://admin-bioclinic.pages.dev',
  'https://bio-clinic.it',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:9090',
];

function corsHeaders(request) {
  const origin = request?.headers?.get('Origin') || '';
  const allowedOrigin = ADMIN_ORIGINS.includes(origin) ? origin : ADMIN_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}

function handleCORS(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  return null;
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

function jsonResponse(data, status = 200, request = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  });
}

function errorResponse(message, status = 400, request = null) {
  return jsonResponse({ error: message, status }, status, request);
}

// ============================================================================
// SUPABASE CLIENT (fallback)
// ============================================================================

function createSupabaseAdmin(env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  return {
    url,
    key,
    async query(table, options = {}) {
      const { select = '*', filter = '', order = '', limit, offset, count = false } = options;

      let endpoint = `${url}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
      if (filter) endpoint += `&${filter}`;
      if (order) endpoint += `&order=${order}`;
      if (limit) endpoint += `&limit=${limit}`;
      if (offset) endpoint += `&offset=${offset}`;

      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      };
      if (count) headers['Prefer'] = 'count=exact';

      const res = await fetch(endpoint, { headers });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Supabase query failed: ${res.status} ${body}`);
      }

      const data = await res.json();
      const totalCount = count ? parseInt(res.headers.get('content-range')?.split('/')[1] || '0') : null;

      return { data, count: totalCount };
    },
  };
}

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

async function withAdminAuth(context, handler) {
  const { request, env } = context;

  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  try {
    // Extract JWT
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return errorResponse('Missing or invalid Authorization header', 401, request);
    }

    const token = authHeader.slice(7);

    // Verify token with Supabase Auth
    const authRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'apikey': env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!authRes.ok) {
      return errorResponse('Invalid or expired token', 401, request);
    }

    const authUser = await authRes.json();

    // Check admin role in our users table
    const db = createSupabaseAdmin(env);
    const { data: users } = await db.query('users', {
      select: 'id,email,role,first_name,last_name,is_active',
      filter: `auth_id=eq.${authUser.id}&is_active=eq.true`,
    });

    const user = Array.isArray(users) ? users[0] : users;

    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return errorResponse('Insufficient permissions: admin role required', 403, request);
    }

    const adminContext = {
      ...user,
      auth_id: authUser.id,
      token,
    };

    return await handler(context, adminContext);
  } catch (err) {
    console.error('[Admin Auth Error]', err.message);
    return errorResponse('Authentication failed: ' + err.message, 500, request);
  }
}

// ============================================================================
// BOOKINGS — D1 QUERIES (primary source)
// ============================================================================

/**
 * Query bookings from D1 database with filtering, pagination, and search.
 */
async function queryBookingsD1(db, params) {
  const { limit = 50, offset = 0, status, dateFrom, dateTo, search, sort = 'booking_date', order = 'desc' } = params;

  let whereClause = '1=1';
  const bindings = [];

  // Status filter
  if (status && ['confirmed', 'completed', 'cancelled', 'pending', 'no_show'].includes(status)) {
    whereClause += ' AND status = ?';
    bindings.push(status);
  }

  // Date range filter
  if (dateFrom) {
    whereClause += ' AND booking_date >= ?';
    bindings.push(dateFrom);
  }
  if (dateTo) {
    whereClause += ' AND booking_date <= ?';
    bindings.push(dateTo);
  }

  // Search by patient name, phone, or service_id
  if (search) {
    whereClause += ' AND (patient_name LIKE ? OR patient_phone LIKE ? OR service_id LIKE ?)';
    const searchPattern = `%${search}%`;
    bindings.push(searchPattern, searchPattern, searchPattern);
  }

  // Validate sort field (prevent SQL injection)
  const allowedSorts = ['booking_date', 'booking_time', 'created_at', 'patient_name', 'status', 'service_id', 'price_eur'];
  const sortField = allowedSorts.includes(sort) ? sort : 'booking_date';
  const sortDir = order === 'asc' ? 'ASC' : 'DESC';

  // Secondary sort by time when sorting by date
  const orderClause = sortField === 'booking_date'
    ? `booking_date ${sortDir}, booking_time ${sortDir}`
    : `${sortField} ${sortDir}`;

  // Count query
  const countResult = await db.prepare(
    `SELECT COUNT(*) as total FROM bookings WHERE ${whereClause}`
  ).bind(...bindings).first();

  const total = countResult?.total || 0;

  // Data query
  const dataResult = await db.prepare(
    `SELECT
      id, transaction_id, service_id, department,
      booking_date, booking_time, duration_minutes,
      patient_name, patient_phone, patient_email, patient_fiscal_code,
      price_eur, currency,
      gclid, lead_source, source_page, utm_source, utm_medium, utm_campaign,
      status, notes, ip_country, ip_city,
      created_at
    FROM bookings
    WHERE ${whereClause}
    ORDER BY ${orderClause}
    LIMIT ? OFFSET ?`
  ).bind(...bindings, limit, offset).all();

  return {
    data: (dataResult?.results || []).map(enrichBooking),
    total,
  };
}

/**
 * Enrich a D1 booking row with computed fields for the admin UI.
 */
function enrichBooking(row) {
  // Map service_id to a human-readable service name
  const serviceNames = {
    'prelievo-standard': 'Prelievo Ematico Standard',
    'prelievo-urgente': 'Prelievo Ematico Urgente',
    'urine-standard': 'Esame Urine Completo',
    'tampone-vaginale': 'Tampone Vaginale / Cervicale',
    'tampone-faringeo': 'Tampone Faringeo',
    'profilo-tiroide': 'Profilo Tiroideo Completo',
    'profilo-ormonale-donna': 'Profilo Ormonale Donna',
    'marcatori-tumorali': 'Pannello Marcatori Tumorali',
    'test-hpv': 'HPV DNA Test',
    'test-allergologico': 'Pannello Allergologico',
    'glicemia-curva': 'Curva Glicemica da Carico',
    'emocromo-completo': 'Emocromo Completo con Formula',
  };

  return {
    ...row,
    service_name: serviceNames[row.service_id] || row.service_id,
    source: row.lead_source || 'website',
  };
}

/**
 * Get a single booking by ID from D1.
 */
async function getBookingD1(db, id) {
  const row = await db.prepare(
    `SELECT * FROM bookings WHERE id = ?`
  ).bind(id).first();

  return row ? enrichBooking(row) : null;
}

/**
 * Update a booking status in D1.
 */
async function updateBookingStatusD1(db, id, status, notes) {
  const validStatuses = ['confirmed', 'completed', 'cancelled', 'no_show', 'pending'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}. Allowed: ${validStatuses.join(', ')}`);
  }

  const updates = ['status = ?'];
  const bindings = [status];

  if (notes !== undefined) {
    updates.push('notes = ?');
    bindings.push(notes);
  }

  bindings.push(id);

  const result = await db.prepare(
    `UPDATE bookings SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...bindings).run();

  return result.changes > 0;
}

// ============================================================================
// BOOKINGS — SUPABASE QUERIES (fallback)
// ============================================================================

async function queryBookingsSupabase(env, params) {
  const { limit = 50, offset = 0, status, dateFrom, search, sort = 'booking_date', order = 'desc' } = params;
  const db = createSupabaseAdmin(env);

  const filters = [];
  if (status) filters.push(`status=eq.${status}`);
  if (dateFrom) filters.push(`booking_date=gte.${dateFrom}`);
  if (search) {
    filters.push(`or=(patient_name.ilike.*${search}*,service_name.ilike.*${search}*)`);
  }

  const filter = filters.join('&');
  const sortField = sort === 'booking_date' ? 'booking_date' : sort;
  const sortDir = order === 'asc' ? 'asc' : 'desc';

  const { data, count } = await db.query('bookings_sync', {
    select: 'id,patient_name,patient_phone,patient_email,service_name,booking_date,booking_time,status,lead_source,price_eur,notes,created_at',
    filter,
    order: `${sortField}.${sortDir}`,
    limit,
    offset,
    count: true,
  });

  return {
    data: (data || []).map(row => ({
      ...row,
      source: row.lead_source || 'website',
    })),
    total: count || data?.length || 0,
  };
}

// ============================================================================
// HANDLERS
// ============================================================================

/**
 * GET /api/admin/bookings
 * Query params:
 *   ?limit=50&offset=0&status=confirmed&date_from=2026-03-01&date_to=2026-03-31
 *   &search=Rossi&sort=booking_date&order=desc
 *   ?id=bc_book_xxxxx (single booking detail)
 */
export async function onRequestGet(context) {
  return withAdminAuth(context, async (ctx, user) => {
    const { env, request } = ctx;
    const url = new URL(request.url);

    // Parse parameters
    const id = url.searchParams.get('id');
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '50')));
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const offset = (page - 1) * limit;
    const status = url.searchParams.get('status') || '';
    const dateFrom = url.searchParams.get('date_from') || '';
    const dateTo = url.searchParams.get('date_to') || '';
    const search = url.searchParams.get('search') || '';
    const sort = url.searchParams.get('sort') || 'booking_date';
    const order = url.searchParams.get('order') || 'desc';

    try {
      let result;
      let source = 'unknown';

      // ── Strategy 1: D1 (primary) ──
      if (env.BOOKING_DB) {
        try {
          // Single booking by ID
          if (id) {
            const booking = await getBookingD1(env.BOOKING_DB, id);
            if (!booking) {
              return errorResponse('Booking not found', 404, request);
            }
            return jsonResponse({ data: booking, _source: 'd1' }, 200, request);
          }

          result = await queryBookingsD1(env.BOOKING_DB, {
            limit, offset, status, dateFrom, dateTo, search, sort, order,
          });
          source = 'd1';
        } catch (d1Err) {
          console.error('[Bookings] D1 query failed, trying Supabase fallback:', d1Err.message);
        }
      }

      // ── Strategy 2: Supabase fallback ──
      if (!result) {
        try {
          result = await queryBookingsSupabase(env, {
            limit, offset, status, dateFrom, search, sort, order,
          });
          source = 'supabase';
        } catch (sbErr) {
          console.error('[Bookings] Supabase fallback failed:', sbErr.message);
        }
      }

      // ── Strategy 3: empty result ──
      if (!result) {
        result = { data: [], total: 0 };
        source = 'none';
      }

      return jsonResponse({
        data: result.data,
        pagination: {
          page,
          limit,
          total: result.total,
          total_pages: Math.ceil(result.total / limit),
        },
        _source: source,
      }, 200, request);

    } catch (err) {
      console.error('[Bookings GET Error]', err);
      return errorResponse('Failed to load bookings: ' + err.message, 500, request);
    }
  });
}

/**
 * PATCH /api/admin/bookings
 * Update booking status/notes.
 * Body: { id: "bc_book_xxx", status: "completed", notes: "..." }
 */
export async function onRequestPatch(context) {
  return withAdminAuth(context, async (ctx, user) => {
    const { env, request } = ctx;

    try {
      const body = await request.json();
      const id = body.id || new URL(request.url).searchParams.get('id');

      if (!id) {
        return errorResponse('Missing booking id', 400, request);
      }

      if (!body.status) {
        return errorResponse('Missing status field', 400, request);
      }

      if (!env.BOOKING_DB) {
        return errorResponse('D1 database not available — cannot update bookings', 503, request);
      }

      const updated = await updateBookingStatusD1(env.BOOKING_DB, id, body.status, body.notes);

      if (!updated) {
        return errorResponse('Booking not found or not updated', 404, request);
      }

      return jsonResponse({
        message: 'Booking updated successfully',
        id,
        status: body.status,
      }, 200, request);

    } catch (err) {
      console.error('[Bookings PATCH Error]', err);
      return errorResponse('Failed to update booking: ' + err.message, 500, request);
    }
  });
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

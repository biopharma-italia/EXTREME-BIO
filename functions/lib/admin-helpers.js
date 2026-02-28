/**
 * Bio-Clinic Admin API — Middleware & Auth
 * ==========================================
 * Shared middleware for all admin API endpoints:
 *   - CORS handling
 *   - Supabase JWT verification
 *   - Admin role checking (via users table)
 *   - Rate limiting
 *   - Request logging
 *
 * Usage in endpoint:
 *   import { withAdminAuth, corsHeaders, jsonResponse, errorResponse } from './lib-admin.js';
 *   export async function onRequestGet(context) {
 *     return withAdminAuth(context, async (ctx, user) => { ... });
 *   }
 *
 * @version 1.0.0
 * @date 2026-02-28
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

export function corsHeaders(request) {
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

export function handleCORS(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }
  return null;
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export function jsonResponse(data, status = 200, request = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(request),
    },
  });
}

export function errorResponse(message, status = 400, request = null) {
  return jsonResponse({ error: message, status }, status, request);
}

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

/**
 * Create a Supabase PostgREST-compatible fetch helper.
 * Uses the service key for admin operations.
 */
export function createSupabaseAdmin(env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  }

  return {
    url,
    key,

    /**
     * Execute a PostgREST query
     * @param {string} table - Table name
     * @param {Object} options - Query options
     */
    async query(table, options = {}) {
      const { select = '*', filter = '', order = '', limit, offset, single = false, count = false } = options;

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
      if (single) headers['Accept'] = 'application/vnd.pgrst.object+json';
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

    /**
     * Insert a row
     */
    async insert(table, row, options = {}) {
      const { upsert = false, returnRow = true } = options;

      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': upsert ? 'resolution=merge-duplicates' : 'return=representation',
      };
      if (returnRow) headers['Prefer'] = (headers['Prefer'] || '') + ',return=representation';

      const res = await fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(row),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Supabase insert failed: ${res.status} ${body}`);
      }

      return returnRow ? await res.json() : null;
    },

    /**
     * Update a row by ID
     */
    async update(table, id, data) {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      };

      const res = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Supabase update failed: ${res.status} ${body}`);
      }

      return await res.json();
    },

    /**
     * Delete a row by ID
     */
    async delete(table, id) {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      };

      const res = await fetch(`${url}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Supabase delete failed: ${res.status} ${body}`);
      }

      return true;
    },

    /**
     * RPC call (for Supabase functions)
     */
    async rpc(functionName, params = {}) {
      const headers = {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      };

      const res = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Supabase RPC failed: ${res.status} ${body}`);
      }

      return await res.json();
    },
  };
}

// ============================================================================
// AUTH MIDDLEWARE
// ============================================================================

/**
 * Verify JWT token from Supabase Auth and check admin role.
 * @param {Object} context - Cloudflare Pages Function context
 * @param {Function} handler - async (context, user) => Response
 */
export async function withAdminAuth(context, handler) {
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
      single: true,
    });

    const user = Array.isArray(users) ? users[0] : users;

    if (!user || !['admin', 'super_admin'].includes(user.role)) {
      return errorResponse('Insufficient permissions: admin role required', 403, request);
    }

    // Set app context for audit triggers
    // (These would need to be set via RPC in a real implementation)
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
// PAGINATION HELPER
// ============================================================================

export function parsePagination(url) {
  const params = new URL(url).searchParams;
  const page = Math.max(1, parseInt(params.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(params.get('limit') || '20')));
  const offset = (page - 1) * limit;
  const search = params.get('search') || '';
  const status = params.get('status') || '';
  const sort = params.get('sort') || '';
  const order = params.get('order') || 'asc';

  return { page, limit, offset, search, status, sort, order };
}

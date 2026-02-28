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
// SUPABASE CLIENT
// ============================================================================

/**
 * Create a Supabase PostgREST-compatible fetch helper.
 * Uses the service key for admin operations.
 */
function createSupabaseAdmin(env) {
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

function parsePagination(url) {
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


// --- CRUD Factory ---

/**
 * Bio-Clinic Admin API — Generic CRUD Factory
 * =============================================
 * Creates standardized CRUD endpoints for entity tables.
 *
 * Provides: GET (list/single), POST (create), PATCH (update), DELETE
 * with pagination, search, filtering, sorting, and audit logging.
 *
 * @version 1.0.0
 * @date 2026-02-28
 */

/**
 * Create CRUD handlers for a given table
 * @param {string} table - Table name in Supabase
 * @param {Object} config - Configuration options
 */
function createCrudHandlers(table, config = {}) {
  const {
    selectFields = '*',
    searchFields = ['name'],
    defaultSort = 'created_at',
    defaultOrder = 'desc',
    validators = {},      // { fieldName: (value) => errorMsg | null }
    requiredFields = [],   // ['name', 'specialty_id']
    readOnlyFields = ['id', 'created_at', 'updated_at', 'search_vector', 'name', 'display_name'],
    allowDelete = true,
  } = config;

  // -------------------------------------------------------
  // GET: List (with pagination, search, filter, sort)
  // -------------------------------------------------------
  async function onRequestGet(context) {
    return withAdminAuth(context, async (ctx, user) => {
      const { env, request } = ctx;
      const db = createSupabaseAdmin(env);
      const url = new URL(request.url);
      const id = url.searchParams.get('id');

      try {
        // Single record by ID
        if (id) {
          const { data } = await db.query(table, {
            select: selectFields,
            filter: `id=eq.${id}`,
            single: true,
          });
          const record = Array.isArray(data) ? data[0] : data;
          if (!record) {
            return errorResponse(`${table} not found: ${id}`, 404, request);
          }
          return jsonResponse({ data: record }, 200, request);
        }

        // List with pagination
        const { page, limit, offset, search, status, sort, order } = parsePagination(request.url);

        let filter = '';
        const filters = [];

        // Status filter
        if (status && ['active', 'inactive', 'hidden'].includes(status)) {
          filters.push(`status=eq.${status}`);
        }

        // Text search (full-text or ILIKE)
        if (search) {
          const searchFilter = searchFields
            .map(f => `${f}=ilike.*${search}*`)
            .join(',');
          filters.push(`or=(${searchFilter})`);
        }

        // Additional filters from query params
        const extraParams = ['specialty_id', 'category', 'type'];
        for (const param of extraParams) {
          const val = url.searchParams.get(param);
          if (val) filters.push(`${param}=eq.${val}`);
        }

        filter = filters.join('&');

        const sortField = sort || defaultSort;
        const sortOrder = order === 'desc' ? 'desc' : 'asc';

        const { data, count } = await db.query(table, {
          select: selectFields,
          filter,
          order: `${sortField}.${sortOrder}`,
          limit,
          offset,
          count: true,
        });

        return jsonResponse({
          data: data || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            total_pages: Math.ceil((count || 0) / limit),
          },
        }, 200, request);
      } catch (err) {
        console.error(`[${table} GET Error]`, err);
        return errorResponse(`Failed to query ${table}: ${err.message}`, 500, request);
      }
    });
  }

  // -------------------------------------------------------
  // POST: Create
  // -------------------------------------------------------
  async function onRequestPost(context) {
    return withAdminAuth(context, async (ctx, user) => {
      const { env, request } = ctx;
      const db = createSupabaseAdmin(env);

      try {
        const body = await request.json();

        // Validate required fields
        for (const field of requiredFields) {
          if (!body[field] && body[field] !== 0 && body[field] !== false) {
            return errorResponse(`Missing required field: ${field}`, 400, request);
          }
        }

        // Run custom validators
        for (const [field, validate] of Object.entries(validators)) {
          if (body[field] !== undefined) {
            const error = validate(body[field]);
            if (error) return errorResponse(`Validation error (${field}): ${error}`, 400, request);
          }
        }

        // Strip read-only fields
        const cleanData = { ...body };
        for (const f of readOnlyFields) {
          if (f !== 'id') delete cleanData[f]; // Keep id for insert
        }

        // Set updated_by
        cleanData.updated_by = user.auth_id;

        const result = await db.insert(table, cleanData);

        return jsonResponse({
          data: Array.isArray(result) ? result[0] : result,
          message: `${table} created successfully`,
        }, 201, request);
      } catch (err) {
        console.error(`[${table} POST Error]`, err);
        if (err.message.includes('duplicate key') || err.message.includes('23505')) {
          return errorResponse(`A ${table} with this ID already exists`, 409, request);
        }
        return errorResponse(`Failed to create ${table}: ${err.message}`, 500, request);
      }
    });
  }

  // -------------------------------------------------------
  // PATCH: Update
  // -------------------------------------------------------
  async function onRequestPatch(context) {
    return withAdminAuth(context, async (ctx, user) => {
      const { env, request } = ctx;
      const db = createSupabaseAdmin(env);

      try {
        const body = await request.json();
        const id = body.id || new URL(request.url).searchParams.get('id');

        if (!id) {
          return errorResponse('Missing id for update', 400, request);
        }

        // Strip read-only fields
        const cleanData = { ...body };
        for (const f of readOnlyFields) {
          delete cleanData[f];
        }

        // Run custom validators
        for (const [field, validate] of Object.entries(validators)) {
          if (cleanData[field] !== undefined) {
            const error = validate(cleanData[field]);
            if (error) return errorResponse(`Validation error (${field}): ${error}`, 400, request);
          }
        }

        // Set updated_by
        cleanData.updated_by = user.auth_id;

        const result = await db.update(table, id, cleanData);

        return jsonResponse({
          data: Array.isArray(result) ? result[0] : result,
          message: `${table} updated successfully`,
        }, 200, request);
      } catch (err) {
        console.error(`[${table} PATCH Error]`, err);
        return errorResponse(`Failed to update ${table}: ${err.message}`, 500, request);
      }
    });
  }

  // -------------------------------------------------------
  // DELETE: Remove
  // -------------------------------------------------------
  async function onRequestDelete(context) {
    if (!allowDelete) {
      return errorResponse('Delete not allowed for this entity', 405, context.request);
    }

    return withAdminAuth(context, async (ctx, user) => {
      const { env, request } = ctx;
      const db = createSupabaseAdmin(env);

      try {
        const id = new URL(request.url).searchParams.get('id');
        if (!id) {
          return errorResponse('Missing id for delete', 400, request);
        }

        // Soft delete (set status to inactive) instead of hard delete
        const useSoftDelete = new URL(request.url).searchParams.get('hard') !== 'true';

        if (useSoftDelete) {
          await db.update(table, id, { status: 'inactive', updated_by: user.auth_id });
          return jsonResponse({ message: `${table} deactivated`, id }, 200, request);
        }

        await db.delete(table, id);
        return jsonResponse({ message: `${table} deleted permanently`, id }, 200, request);
      } catch (err) {
        console.error(`[${table} DELETE Error]`, err);
        return errorResponse(`Failed to delete ${table}: ${err.message}`, 500, request);
      }
    });
  }

  // -------------------------------------------------------
  // OPTIONS: CORS preflight
  // -------------------------------------------------------
  async function onRequestOptions(context) {
    return new Response(null, { status: 204, headers: corsHeaders(context.request) });
  }

  return {
    onRequestGet,
    onRequestPost,
    onRequestPatch,
    onRequestDelete,
    onRequestOptions,
  };
}


/**
 * Bio-Clinic Admin API — Admin Users (M13)
 * GET/POST/PATCH/DELETE /api/admin/users
 * ==========================================
 * Manage admin panel users and their roles.
 *
 * GET:    List all admin users (super_admin only)
 * POST:   Invite new user { email, name, role }
 * PATCH:  Update user { id, role?, status?, name? }
 * DELETE: Deactivate user { id }
 *
 * @version 1.0.0
 * @date 2026-02-28
 */

const VALID_ROLES = ['super_admin', 'admin', 'editor', 'viewer'];

export async function onRequestGet(context) {
  return withAdminAuth(context, async (ctx, user) => {
    const { env, request } = ctx;

    // Only super_admin and admin can view users
    if (!['super_admin', 'admin'].includes(user.role)) {
      return errorResponse('Insufficient permissions', 403, request);
    }

    const db = createSupabaseAdmin(env);

    try {
      const { data } = await db.query('admin_users', {
        select: 'id,email,name,role,status,last_login,created_at',
        order: 'created_at.desc',
      });

      return jsonResponse({ data: data || [] }, 200, request);
    } catch (err) {
      console.error('[Users GET Error]', err);
      return errorResponse('Failed to load users: ' + err.message, 500, request);
    }
  });
}

export async function onRequestPost(context) {
  return withAdminAuth(context, async (ctx, user) => {
    const { env, request } = ctx;

    // Only super_admin can invite users
    if (user.role !== 'super_admin') {
      return errorResponse('Only super_admin can invite users', 403, request);
    }

    const db = createSupabaseAdmin(env);

    try {
      const body = await request.json();
      const { email, name, role } = body;

      if (!email || !email.includes('@')) {
        return errorResponse('Valid email is required', 400, request);
      }

      if (role && !VALID_ROLES.includes(role)) {
        return errorResponse(`Invalid role. Valid: ${VALID_ROLES.join(', ')}`, 400, request);
      }

      // Create auth user via Supabase Auth API
      const supabaseUrl = env.SUPABASE_URL;
      const serviceKey = env.SUPABASE_SERVICE_KEY;

      // Create user in Supabase Auth
      const authRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
        },
        body: JSON.stringify({
          email,
          email_confirm: true,
          user_metadata: { name, role: role || 'viewer' },
        }),
      });

      if (!authRes.ok) {
        const err = await authRes.json();
        return errorResponse('Auth error: ' + (err.message || err.msg), 400, request);
      }

      const authUser = await authRes.json();

      // Also insert into admin_users table for quick queries
      await db.insert('admin_users', {
        auth_id: authUser.id,
        email,
        name: name || null,
        role: role || 'viewer',
        status: 'active',
        invited_by: user.auth_id,
      });

      return jsonResponse({
        data: { id: authUser.id, email, name, role: role || 'viewer' },
        message: `User ${email} invited successfully`,
      }, 201, request);
    } catch (err) {
      console.error('[Users POST Error]', err);
      return errorResponse('Failed to invite user: ' + err.message, 500, request);
    }
  });
}

export async function onRequestPatch(context) {
  return withAdminAuth(context, async (ctx, user) => {
    const { env, request } = ctx;

    // Only super_admin can modify users
    if (user.role !== 'super_admin') {
      return errorResponse('Only super_admin can modify users', 403, request);
    }

    const db = createSupabaseAdmin(env);

    try {
      const body = await request.json();
      const { id, role, status, name } = body;

      if (!id) {
        return errorResponse('Missing required field: id', 400, request);
      }

      if (role && !VALID_ROLES.includes(role)) {
        return errorResponse(`Invalid role. Valid: ${VALID_ROLES.join(', ')}`, 400, request);
      }

      const updates = {};
      if (role) updates.role = role;
      if (status) updates.status = status;
      if (name !== undefined) updates.name = name;
      updates.updated_at = new Date().toISOString();

      const result = await db.update('admin_users', id, updates);

      return jsonResponse({
        data: Array.isArray(result) ? result[0] : result,
        message: 'User updated',
      }, 200, request);
    } catch (err) {
      console.error('[Users PATCH Error]', err);
      return errorResponse('Failed to update user: ' + err.message, 500, request);
    }
  });
}

export async function onRequestDelete(context) {
  return withAdminAuth(context, async (ctx, user) => {
    const { env, request } = ctx;

    // Only super_admin can delete users
    if (user.role !== 'super_admin') {
      return errorResponse('Only super_admin can delete users', 403, request);
    }

    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      return errorResponse('Missing required parameter: id', 400, request);
    }

    const db = createSupabaseAdmin(env);

    try {
      // Soft-delete: set status to inactive
      await db.update('admin_users', id, {
        status: 'inactive',
        updated_at: new Date().toISOString(),
      });

      return jsonResponse({ message: 'User deactivated' }, 200, request);
    } catch (err) {
      console.error('[Users DELETE Error]', err);
      return errorResponse('Failed to deactivate user: ' + err.message, 500, request);
    }
  });
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders(context.request) });
}

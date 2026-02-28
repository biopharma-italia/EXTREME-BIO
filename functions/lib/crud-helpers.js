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

import {
  withAdminAuth,
  createSupabaseAdmin,
  jsonResponse,
  errorResponse,
  corsHeaders,
  parsePagination,
} from './lib-admin.js';

/**
 * Create CRUD handlers for a given table
 * @param {string} table - Table name in Supabase
 * @param {Object} config - Configuration options
 */
export function createCrudHandlers(table, config = {}) {
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

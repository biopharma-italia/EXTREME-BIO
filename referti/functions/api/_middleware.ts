/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — Global API Middleware
 * ============================================================================
 * Cloudflare Pages Functions middleware.
 * Runs on every /api/* request before the route handler.
 * 
 * Pipeline: requestId → cors → contentType → rateLimit → auth → handler → audit → errorHandle
 *
 * @version 3.0.0 — 2026-05-11
 * Fixes: P0-3 rate limiting, P0-4 CORS multi-origin, P2-4 Content-Type validation
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { UserRole, RequestContext } from '../../src/lib/types';

// ── Types ───────────────────────────────────────────────────────────────────

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  SUPABASE_ANON_KEY: string;
  ALLOWED_ORIGINS: string;
  APP_ENV: string;
  MASTER_ENCRYPTION_KEY: string;
  LLM_API_KEY: string;
  LLM_BASE_URL: string;
  LLM_MODEL: string;
  WASENDER_API_KEY: string;
  WASENDER_SESSION_ID: string;
  WASENDER_BASE_URL: string;
  CRON_SECRET: string;
  RATE_LIMIT_KV?: KVNamespace;
}

// ── Public Routes (no auth required) ────────────────────────────────────────

const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
  '/api/auth/verify-2fa',
  '/api/admin/gipo/sync',      // Auth gestita internamente (X-Gipo-Sync-Key o token admin)
  '/api/cron/send-reminders',  // Auth gestita internamente (X-Cron-Secret)
  '/api/cron/export-secrets',  // Auth gestita internamente (X-Cron-Secret / GitHub OIDC)
  '/api/cron/delivery-stats',  // Auth gestita internamente (X-Cron-Secret / GitHub OIDC)
  '/api/cron/retry-failed-notifications', // Auth gestita internamente (X-Cron-Secret / GitHub OIDC)
  '/api/cron/review-request',  // Auth gestita internamente (X-Cron-Secret / GitHub OIDC)
  '/api/cron/second-reminder', // Auth gestita internamente (X-Cron-Secret / GitHub OIDC)
  '/api/cron/abnormal-alert',  // Auth gestita internamente (X-Cron-Secret / GitHub OIDC)
  '/api/admin/users/phone-audit', // Auth gestita internamente (X-Cron-Secret o token admin)
];

// ── Rate Limit Config ───────────────────────────────────────────────────────

const RATE_LIMITS: Record<string, { max: number; windowSec: number }> = {
  '/api/auth/login': { max: 5, windowSec: 60 },
  '/api/auth/register': { max: 3, windowSec: 60 },
  '/api/auth/forgot-password': { max: 3, windowSec: 60 },
  '/api/auth/verify-2fa': { max: 5, windowSec: 60 },
  '/api/auth/reset-password': { max: 5, windowSec: 300 },
  '/api/ai/generate-report': { max: 10, windowSec: 60 },
  '/api/ai/finalize-report': { max: 5, windowSec: 60 },
  'default': { max: 60, windowSec: 60 },
};

// In-memory rate limit store (per-isolate, resets on cold start)
// For production with multiple isolates, use KV or Durable Objects.
const rateLimitStore = new Map<string, { count: number; expiresAt: number }>();

// ── Middleware ───────────────────────────────────────────────────────────────

export async function onRequest(context: {
  request: Request;
  env: Env;
  next: () => Promise<Response>;
  data: Record<string, unknown>;
}) {
  const { request, env, next, data } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // ── 1. Request ID ──────────────────────────────────────────────────────
  const requestId = crypto.randomUUID();

  // ── 2. CORS (fixed: single origin matching) ───────────────────────────
  const origin = request.headers.get('Origin') || '';
  const allowedOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  // Match origin against whitelist; allow localhost in dev
  const isAllowed =
    allowedOrigins.includes(origin) ||
    (env.APP_ENV === 'development' && origin.startsWith('http://localhost'));

  if (request.method === 'OPTIONS') {
    return corsPreflightResponse(origin, isAllowed);
  }

  if (origin && !isAllowed) {
    return jsonError('CORS origin not allowed', 403, requestId);
  }

  // ── 3. Content-Type validation for mutation methods ────────────────────
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const ct = request.headers.get('Content-Type') || '';
    // Allow JSON and multipart (file uploads)
    if (!ct.includes('application/json') && !ct.includes('multipart/form-data')) {
      return jsonError('Content-Type deve essere application/json o multipart/form-data.', 415, requestId);
    }
  }

  // ── 4. Rate Limiting (implemented) ─────────────────────────────────────
  const clientIp = request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown';

  const rateConfig = RATE_LIMITS[path] || RATE_LIMITS['default'];
  const rateLimitResult = checkRateLimit(clientIp, path, rateConfig);

  if (!rateLimitResult.allowed) {
    const retryAfter = Math.ceil((rateLimitResult.expiresAt - Date.now()) / 1000);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Troppi tentativi. Riprova tra poco.',
        retry_after: retryAfter,
        request_id: requestId,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter),
          'X-Request-ID': requestId,
          ...corsHeaders(origin, isAllowed),
        },
      }
    );
  }

  // ── 5. Auth (skip for public routes) ───────────────────────────────────
  let userContext: RequestContext['user'] = null;

  if (!PUBLIC_ROUTES.includes(path)) {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return jsonError('Autenticazione richiesta.', 401, requestId);
    }

    // Verify JWT against Supabase
    try {
      const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });

      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        return jsonError('Token non valido o scaduto.', 401, requestId);
      }

      // Get application user profile
      const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: profile, error: profileError } = await adminClient
        .from('users')
        .select('id, auth_id, role, email, is_active, locked_until')
        .eq('auth_id', user.id)
        .single();

      if (profileError || !profile) {
        return jsonError('Profilo utente non trovato.', 401, requestId);
      }

      if (!profile.is_active) {
        return jsonError('Account disattivato. Contattare il supporto.', 401, requestId);
      }

      if (profile.locked_until && new Date(profile.locked_until) > new Date()) {
        return jsonError('Account temporaneamente bloccato.', 423, requestId);
      }

      userContext = {
        id: profile.id,
        auth_id: profile.auth_id,
        role: profile.role as UserRole,
        email: profile.email,
      };
    } catch {
      return jsonError('Errore di autenticazione.', 401, requestId);
    }
  }

  // ── 6. Attach context to data ──────────────────────────────────────────
  const ctx: RequestContext = {
    requestId,
    user: userContext,
    ip: clientIp,
    userAgent: request.headers.get('User-Agent') || 'unknown',
  };

  data.ctx = ctx;
  data.env = env;

  // ── 7. Execute route handler ───────────────────────────────────────────
  try {
    const response = await next();

    // Add security headers + CORS to all responses
    const headers = new Headers(response.headers);
    headers.set('X-Request-ID', requestId);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'DENY');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('X-RateLimit-Remaining', String(Math.max(0, rateConfig.max - rateLimitResult.count)));

    if (origin && isAllowed) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (err) {
    // ── 8. Global error handler ──────────────────────────────────────────
    console.error(`[API Error] ${requestId}:`, err);

    // Audit log critical error (fire-and-forget)
    logAuditError(env, ctx, err as Error);

    return jsonError(
      'Si è verificato un errore interno. Riprovare più tardi.',
      500,
      requestId
    );
  }
}

// ── Rate Limiting Implementation ────────────────────────────────────────────

function checkRateLimit(
  ip: string,
  path: string,
  config: { max: number; windowSec: number }
): { allowed: boolean; count: number; expiresAt: number } {
  const now = Date.now();
  const key = `${ip}:${path}`;

  // Clean expired entries periodically (every 100th call)
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore) {
      if (v.expiresAt < now) rateLimitStore.delete(k);
    }
  }

  const entry = rateLimitStore.get(key);

  if (!entry || entry.expiresAt < now) {
    // New window
    const expiresAt = now + config.windowSec * 1000;
    rateLimitStore.set(key, { count: 1, expiresAt });
    return { allowed: true, count: 1, expiresAt };
  }

  entry.count++;

  if (entry.count > config.max) {
    return { allowed: false, count: entry.count, expiresAt: entry.expiresAt };
  }

  return { allowed: true, count: entry.count, expiresAt: entry.expiresAt };
}

// ── CORS Helpers ────────────────────────────────────────────────────────────

function corsHeaders(origin: string, isAllowed: boolean): Record<string, string> {
  if (!origin || !isAllowed) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
  };
}

function corsPreflightResponse(origin: string, isAllowed: boolean): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': isAllowed ? origin : '',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID, X-Gipo-Sync-Key',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function jsonError(message: string, status: number, requestId: string): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      request_id: requestId,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    }
  );
}

async function logAuditError(env: Env, ctx: RequestContext, error: Error): Promise<void> {
  try {
    const adminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await adminClient.from('audit_log').insert({
      user_id: ctx.user?.id || null,
      user_role: ctx.user?.role || null,
      action: 'admin_action',
      target_type: 'system',
      ip_address: ctx.ip,
      user_agent: ctx.userAgent,
      request_id: ctx.requestId,
      details: {
        error_type: 'unhandled_exception',
        error_message: error.message?.substring(0, 500),
        error_stack: error.stack?.substring(0, 1000),
      },
      risk_level: 'critical',
    });
  } catch {
    // Don't throw in error handler
    console.error('[Audit] Failed to log error:', error.message);
  }
}

// ── Exports for route handlers ──────────────────────────────────────────────

export function requireRole(ctx: RequestContext, ...roles: UserRole[]): Response | null {
  if (!ctx.user) {
    return jsonError('Autenticazione richiesta.', 401, ctx.requestId);
  }
  if (!roles.includes(ctx.user.role)) {
    return jsonError('Permessi insufficienti.', 403, ctx.requestId);
  }
  return null; // Authorized
}

export function jsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

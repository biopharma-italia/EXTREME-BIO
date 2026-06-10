/**
 * MDL Bio-Clinic — API Middleware
 * Auth verification, rate limiting, CORS, request context
 */

import { createClient } from '@supabase/supabase-js';

interface Env {
  APP_URL: string;
  APP_ENV: string;
  ALLOWED_ORIGINS: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  SB_SERVICE_KEY: string;
  MASTER_ENCRYPTION_KEY: string;
  RESEND_API_KEY: string;
}

interface RequestContext {
  requestId: string;
  user: {
    id: string;
    auth_id: string;
    role: string;
    email: string;
    company_id: string | null;
  } | null;
  ip: string;
  userAgent: string;
  supabaseAdmin: any;
  env: Env;
}

// Rate limit store (in-memory, resets on cold start)
const rateLimits: Record<string, { count: number; resetAt: number }> = {};

const RATE_LIMITS: Record<string, { max: number; windowSec: number }> = {
  '/api/auth/login': { max: 5, windowSec: 60 },
  '/api/auth/register': { max: 3, windowSec: 300 },
  '/api/auth/forgot-password': { max: 3, windowSec: 300 },
  '/api/companies': { max: 30, windowSec: 60 },
  '/api/workers': { max: 30, windowSec: 60 },
  '/api/visits': { max: 30, windowSec: 60 },
};

// Public routes that don't require auth
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/refresh',
];

export const onRequest: PagesFunction<Env>[] = [
  // ── CORS ─────────────────────────────────────────────────────────────
  async (context) => {
    const { request, env } = context;
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = (env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim());

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
          'Access-Control-Max-Age': '86400',
          'Access-Control-Allow-Credentials': 'true',
        },
      });
    }

    const response = await context.next();

    // Add CORS headers to response
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', allowedOrigins.includes(origin) ? origin : allowedOrigins[0]);
    headers.set('Access-Control-Allow-Credentials', 'true');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },

  // ── Rate Limiting ────────────────────────────────────────────────────
  async (context) => {
    const { request } = context;
    const url = new URL(request.url);
    const path = url.pathname;
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';

    const limit = RATE_LIMITS[path];
    if (limit) {
      const key = `${ip}:${path}`;
      const now = Date.now();
      const entry = rateLimits[key];

      if (entry && entry.resetAt > now) {
        if (entry.count >= limit.max) {
          return Response.json(
            { success: false, error: 'Troppe richieste. Riprova tra poco.' },
            { status: 429, headers: { 'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)) } }
          );
        }
        entry.count++;
      } else {
        rateLimits[key] = { count: 1, resetAt: now + limit.windowSec * 1000 };
      }
    }

    return context.next();
  },

  // ── Auth & Context ───────────────────────────────────────────────────
  async (context) => {
    const { request, env } = context;

    try {
      const url = new URL(request.url);
      const path = url.pathname;

      // Generate request ID
      const requestId = crypto.randomUUID();

      // Validate env — support both SUPABASE_SERVICE_KEY and SB_SERVICE_KEY
      const serviceKey = env.SUPABASE_SERVICE_KEY || env.SB_SERVICE_KEY;
      if (!env.SUPABASE_URL || !serviceKey) {
        return Response.json({
          success: false,
          error: 'Server misconfigured',
        }, { status: 500 });
      }

      // Create Supabase admin client
      const supabaseAdmin = createClient(env.SUPABASE_URL, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const userAgent = request.headers.get('User-Agent') || '';

      // Check if public route
      const isPublic = PUBLIC_ROUTES.some(r => path.startsWith(r));

      let user: RequestContext['user'] = null;

      if (!isPublic) {
        // Extract token
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return Response.json(
            { success: false, error: 'Token di autenticazione mancante' },
            { status: 401 }
          );
        }

        const token = authHeader.slice(7);

        // Verify with Supabase
        const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
        if (authError || !authUser) {
          return Response.json(
            { success: false, error: 'Sessione scaduta. Effettua nuovamente il login.' },
            { status: 401 }
          );
        }

        // Get MDL user profile
        const { data: profile, error: profileError } = await supabaseAdmin
          .from('mdl_users')
          .select('id, auth_id, role, email, company_id')
          .eq('auth_id', authUser.id)
          .eq('is_active', true)
          .single();

        if (profileError || !profile) {
          return Response.json(
            { success: false, error: 'Utente non autorizzato per MDL' },
            { status: 403 }
          );
        }

        user = {
          id: profile.id,
          auth_id: profile.auth_id,
          role: profile.role,
          email: profile.email,
          company_id: profile.company_id,
        };
      }

      // Attach context to request
      (context as any).data = {
        requestId,
        user,
        ip,
        userAgent,
        supabaseAdmin,
        env,
      } as RequestContext;

      // Process request
      const response = await context.next();

      // Add security headers
      const headers = new Headers(response.headers);
      headers.set('X-Request-ID', requestId);
      headers.set('X-Content-Type-Options', 'nosniff');
      headers.set('X-Frame-Options', 'DENY');
      headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (err: any) {
      return Response.json({
        success: false,
        error: 'Errore interno del server',
      }, { status: 500 });
    }
  },
];

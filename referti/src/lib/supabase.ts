/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — Supabase Client
 * ============================================================================
 * Initializes and exports typed Supabase client instances.
 * 
 * Usage:
 *   Client-side: import { supabase } from '$lib/supabase'
 *   Server-side: import { createServerClient } from '$lib/supabase'
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// ── Environment Variables ───────────────────────────────────────────────────

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Missing PUBLIC_SUPABASE_URL or PUBLIC_SUPABASE_ANON_KEY');
}

// ── Client-Side Supabase (browser) ──────────────────────────────────────────

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ── Server-Side Supabase (Cloudflare Workers / Edge Functions) ──────────────

/**
 * Creates a server-side Supabase client with the service role key.
 * This client bypasses RLS and should ONLY be used in server-side code.
 * 
 * @param serviceKey - Supabase service role key from env
 * @returns SupabaseClient with admin privileges
 */
export function createServerClient(serviceKey: string): SupabaseClient {
  if (!SUPABASE_URL) {
    throw new Error('[Supabase] SUPABASE_URL is not configured');
  }
  if (!serviceKey) {
    throw new Error('[Supabase] Service key is required for server client');
  }

  return createClient(SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a Supabase client authenticated as a specific user (via their JWT).
 * This client respects RLS and sees only what that user is allowed to see.
 * 
 * @param accessToken - User's JWT access token
 * @returns SupabaseClient scoped to the user's permissions
 */
export function createUserClient(accessToken: string): SupabaseClient {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('[Supabase] Missing configuration');
  }

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

// ── Realtime Helpers ────────────────────────────────────────────────────────

/**
 * Subscribe to notifications channel for a specific user.
 * Used in the patient/lab dashboard for real-time updates.
 */
export function subscribeToNotifications(
  userId: string,
  onNotification: (payload: Record<string, unknown>) => void
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNotification(payload.new as Record<string, unknown>);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribe to report status changes (for lab/admin dashboards).
 */
export function subscribeToReportChanges(
  onReportChange: (payload: Record<string, unknown>) => void
) {
  const channel = supabase
    .channel('report-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reports',
      },
      (payload) => {
        onReportChange(payload.new as Record<string, unknown>);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

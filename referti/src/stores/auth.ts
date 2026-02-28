/**
 * ============================================================================
 * Auth Store — Svelte reactive store for authentication state
 * ============================================================================
 */

import { writable, derived } from 'svelte/store';
import { supabase } from '$lib/supabase';
import type { UserProfile, UserRole } from '$lib/types';

// ── State ────────────────────────────────────────────────────────────────────

interface AuthState {
  user: UserProfile | null;
  session: { access_token: string; refresh_token: string } | null;
  loading: boolean;
  error: string | null;
  requires2fa: boolean;
  tempToken: string | null;
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: true,
  error: null,
  requires2fa: false,
  tempToken: null,
};

export const auth = writable<AuthState>(initialState);

// ── Derived Stores ───────────────────────────────────────────────────────────

export const isLoggedIn = derived(auth, ($auth) => !!$auth.user && !!$auth.session);
export const currentUser = derived(auth, ($auth) => $auth.user);
export const userRole = derived(auth, ($auth) => $auth.user?.role || null);
export const isAdmin = derived(auth, ($auth) =>
  ['admin', 'super_admin'].includes($auth.user?.role || '')
);
export const isLabTech = derived(auth, ($auth) =>
  ['lab_technician', 'admin', 'super_admin'].includes($auth.user?.role || '')
);

// ── Actions ──────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<void> {
  auth.update((s) => ({ ...s, loading: true, error: null }));

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!data.success) {
      auth.update((s) => ({ ...s, loading: false, error: data.message || data.error }));
      return;
    }

    if (data.requires_2fa) {
      auth.update((s) => ({
        ...s,
        loading: false,
        requires2fa: true,
        tempToken: data.temp_token,
      }));
      return;
    }

    auth.update((s) => ({
      ...s,
      user: data.user,
      session: data.session,
      loading: false,
      requires2fa: false,
      tempToken: null,
    }));
  } catch {
    auth.update((s) => ({ ...s, loading: false, error: 'Errore di connessione.' }));
  }
}

export async function verify2fa(code: string, isBackup = false): Promise<void> {
  auth.update((s) => ({ ...s, loading: true, error: null }));

  let tempToken: string | null = null;
  auth.subscribe((s) => (tempToken = s.tempToken))();

  try {
    const body = isBackup ? { backup_code: code } : { code };
    const res = await fetch('/api/auth/verify-2fa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tempToken}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!data.success) {
      auth.update((s) => ({ ...s, loading: false, error: data.error }));
      return;
    }

    auth.update((s) => ({
      ...s,
      session: data.session,
      loading: false,
      requires2fa: false,
      tempToken: null,
    }));

    // Fetch full profile
    await fetchProfile();
  } catch {
    auth.update((s) => ({ ...s, loading: false, error: 'Errore di connessione.' }));
  }
}

export async function logout(): Promise<void> {
  let session: { access_token: string } | null = null;
  auth.subscribe((s) => (session = s.session))();

  if (session) {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${(session as { access_token: string }).access_token}` },
    }).catch(() => {});
  }

  auth.set(initialState);
  auth.update((s) => ({ ...s, loading: false }));
}

export async function fetchProfile(): Promise<void> {
  let session: { access_token: string } | null = null;
  auth.subscribe((s) => (session = s.session))();

  if (!session) return;

  const res = await fetch('/api/users/me', {
    headers: { Authorization: `Bearer ${(session as { access_token: string }).access_token}` },
  });
  const data = await res.json();

  if (data.success) {
    auth.update((s) => ({ ...s, user: data.data }));
  }
}

// ── Initialize ───────────────────────────────────────────────────────────────

export function initAuth(): void {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session) {
      auth.update((s) => ({
        ...s,
        session: {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        },
        loading: false,
      }));
      fetchProfile();
    } else {
      auth.update((s) => ({ ...s, user: null, session: null, loading: false }));
    }
  });
}

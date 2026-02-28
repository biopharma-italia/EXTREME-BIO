/**
 * ============================================================================
 * REFERTI.BIO-CLINIC.IT — API Client Wrapper
 * ============================================================================
 * Authenticated fetch wrapper for API calls.
 */

import { get } from 'svelte/store';
import { auth, logout } from '$stores/auth';
import type { ApiResponse } from './types';

const BASE_URL = '';  // Same origin

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const session = get(auth).session;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    // Token expired — auto logout
    if (response.status === 401) {
      await logout();
      return { success: false, error: 'Sessione scaduta. Effettua nuovamente il login.' };
    }

    const data = await response.json();
    return data;
  } catch {
    return { success: false, error: 'Errore di connessione al server.' };
  }
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: 'GET' }),
  post: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(endpoint: string, body: unknown) =>
    apiRequest<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};

/**
 * ============================================================================
 * Reports Store — Svelte reactive store for reports state
 * ============================================================================
 */

import { writable, derived } from 'svelte/store';
import { auth } from './auth';
import type { ReportListItem, ReportDetail, ReportStatus } from '$lib/types';

interface ReportsState {
  items: ReportListItem[];
  currentReport: ReportDetail | null;
  loading: boolean;
  error: string | null;
  filters: {
    status: ReportStatus | '';
    category: string;
    from: string;
    to: string;
    search: string;
    urgent: boolean;
    abnormal: boolean;
  };
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

const initialState: ReportsState = {
  items: [],
  currentReport: null,
  loading: false,
  error: null,
  filters: { status: '', category: '', from: '', to: '', search: '', urgent: false, abnormal: false },
  pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
};

export const reports = writable<ReportsState>(initialState);

export const hasReports = derived(reports, ($r) => $r.items.length > 0);
export const pendingCount = derived(reports, ($r) => $r.items.filter((i) => i.status === 'pending').length);

// Helper to get auth token
function getToken(): string | null {
  let token: string | null = null;
  auth.subscribe((s) => (token = s.session?.access_token || null))();
  return token;
}

export async function fetchReports(page = 1): Promise<void> {
  const token = getToken();
  if (!token) return;

  reports.update((s) => ({ ...s, loading: true, error: null }));

  let currentFilters: ReportsState['filters'] = initialState.filters;
  reports.subscribe((s) => (currentFilters = s.filters))();

  const params = new URLSearchParams({ page: page.toString(), per_page: '20' });
  if (currentFilters.status) params.set('status', currentFilters.status);
  if (currentFilters.category) params.set('category', currentFilters.category);
  if (currentFilters.from) params.set('from', currentFilters.from);
  if (currentFilters.to) params.set('to', currentFilters.to);
  if (currentFilters.search) params.set('search', currentFilters.search);
  if (currentFilters.urgent) params.set('urgent', 'true');
  if (currentFilters.abnormal) params.set('abnormal', 'true');

  try {
    const res = await fetch(`/api/reports?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.success) {
      reports.update((s) => ({ ...s, items: data.data, pagination: data.pagination, loading: false }));
    } else {
      reports.update((s) => ({ ...s, loading: false, error: data.error }));
    }
  } catch {
    reports.update((s) => ({ ...s, loading: false, error: 'Errore di connessione.' }));
  }
}

export async function fetchReportDetail(id: string): Promise<void> {
  const token = getToken();
  if (!token) return;

  reports.update((s) => ({ ...s, loading: true, error: null }));

  try {
    const res = await fetch(`/api/reports/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.success) {
      reports.update((s) => ({ ...s, currentReport: data.data, loading: false }));
    } else {
      reports.update((s) => ({ ...s, loading: false, error: data.error }));
    }
  } catch {
    reports.update((s) => ({ ...s, loading: false, error: 'Errore di connessione.' }));
  }
}

export function updateFilters(filters: Partial<ReportsState['filters']>): void {
  reports.update((s) => ({
    ...s,
    filters: { ...s.filters, ...filters },
    pagination: { ...s.pagination, page: 1 },
  }));
  fetchReports(1);
}

export function resetFilters(): void {
  reports.update((s) => ({ ...s, filters: initialState.filters }));
  fetchReports(1);
}

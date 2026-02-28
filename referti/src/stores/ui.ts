/**
 * ============================================================================
 * UI Store — Svelte reactive store for UI state
 * ============================================================================
 */

import { writable } from 'svelte/store';

// ── Sidebar ──────────────────────────────────────────────────────────────────

export const sidebarOpen = writable<boolean>(false);
export const toggleSidebar = () => sidebarOpen.update((v) => !v);

// ── Toasts ───────────────────────────────────────────────────────────────────

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
}

export const toasts = writable<Toast[]>([]);

export function addToast(
  message: string,
  type: Toast['type'] = 'info',
  duration = 5000
): void {
  const id = crypto.randomUUID();
  toasts.update((t) => [...t, { id, type, message, duration }]);

  if (duration > 0) {
    setTimeout(() => {
      toasts.update((t) => t.filter((toast) => toast.id !== id));
    }, duration);
  }
}

export function removeToast(id: string): void {
  toasts.update((t) => t.filter((toast) => toast.id !== id));
}

// ── Modals ───────────────────────────────────────────────────────────────────

interface ModalState {
  open: boolean;
  component: string | null;
  props: Record<string, unknown>;
}

export const modal = writable<ModalState>({
  open: false,
  component: null,
  props: {},
});

export function openModal(component: string, props: Record<string, unknown> = {}): void {
  modal.set({ open: true, component, props });
}

export function closeModal(): void {
  modal.set({ open: false, component: null, props: {} });
}

// ── Loading ──────────────────────────────────────────────────────────────────

export const globalLoading = writable<boolean>(false);

// ── Theme ────────────────────────────────────────────────────────────────────

export const darkMode = writable<boolean>(false);

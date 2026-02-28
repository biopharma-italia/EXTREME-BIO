/**
 * ============================================================================
 * Notifications Store — Svelte reactive store for notifications
 * ============================================================================
 */

import { writable, derived } from 'svelte/store';
import { auth } from './auth';
import { subscribeToNotifications } from '$lib/supabase';

interface NotificationsState {
  items: Array<{
    id: string;
    channel: string;
    subject: string | null;
    body: string;
    report_id: string | null;
    action_url: string | null;
    status: string;
    read_at: string | null;
    created_at: string;
  }>;
  unreadCount: number;
  loading: boolean;
}

export const notifications = writable<NotificationsState>({
  items: [],
  unreadCount: 0,
  loading: false,
});

export const unreadCount = derived(notifications, ($n) => $n.unreadCount);

function getToken(): string | null {
  let token: string | null = null;
  auth.subscribe((s) => (token = s.session?.access_token || null))();
  return token;
}

export async function fetchNotifications(): Promise<void> {
  const token = getToken();
  if (!token) return;

  notifications.update((s) => ({ ...s, loading: true }));

  try {
    const res = await fetch('/api/notifications?per_page=50', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.success) {
      notifications.update((s) => ({
        ...s,
        items: data.data,
        unreadCount: data.unread_count,
        loading: false,
      }));
    }
  } catch {
    notifications.update((s) => ({ ...s, loading: false }));
  }
}

export async function markAsRead(id: string): Promise<void> {
  const token = getToken();
  if (!token) return;

  await fetch(`/api/notifications/${id}/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  notifications.update((s) => ({
    ...s,
    items: s.items.map((n) =>
      n.id === id ? { ...n, read_at: new Date().toISOString(), status: 'read' } : n
    ),
    unreadCount: Math.max(0, s.unreadCount - 1),
  }));
}

export async function markAllAsRead(): Promise<void> {
  const token = getToken();
  if (!token) return;

  await fetch('/api/notifications/read-all', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  });

  notifications.update((s) => ({
    ...s,
    items: s.items.map((n) => ({ ...n, read_at: new Date().toISOString(), status: 'read' })),
    unreadCount: 0,
  }));
}

// Realtime subscription
let unsubscribe: (() => void) | null = null;

export function startRealtimeNotifications(userId: string): void {
  stopRealtimeNotifications();
  unsubscribe = subscribeToNotifications(userId, () => {
    fetchNotifications();
  });
}

export function stopRealtimeNotifications(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}

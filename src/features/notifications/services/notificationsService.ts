import { api } from "@lib/api/client";
import type { Paginated } from "@models/api";

export interface NotificationItem {
  id: string;
  type: string; // 'SESSION_REVOKED', 'APPOINTMENT_CHECKED_IN', …
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  link: string | null; // app route to open
  isUrgent: boolean;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsQuery {
  page: number;
  limit: number;
  unread?: boolean; // true = only unread, false = only read
  urgent?: boolean; // true = only urgent, false = only normal
  type?: string;
  from?: string; // ISO
  to?: string;
  sort?: string; // 'createdAt:asc'
}

// Known types for the filter (each phase adds the ones it creates)
export const NOTIFICATION_TYPES = ["SESSION_REVOKED"];

// Own notifications only (notification-history-service)
export async function listNotifications(
  query: NotificationsQuery,
): Promise<Paginated<NotificationItem>> {
  const { data } = await api.get<Paginated<NotificationItem>>("/notifications", {
    params: query,
  });
  return data;
}

export async function markNotificationRead(id: string): Promise<NotificationItem> {
  const { data } = await api.patch<NotificationItem>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<{ updated: number }> {
  const { data } = await api.patch<{ updated: number }>("/notifications/read-all");
  return data;
}

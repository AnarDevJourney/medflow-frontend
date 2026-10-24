import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationItem,
  type NotificationsQuery,
} from "../services/notificationsService";

// Every notifications query starts with this — a socket push invalidates all
export const notificationsKey = ["notifications"] as const;

export function useNotificationsList(query: NotificationsQuery, enabled = true) {
  return useQuery({
    queryKey: [...notificationsKey, query],
    queryFn: () => listNotifications(query),
    enabled,
    placeholderData: keepPreviousData,
  });
}

// Mark read (the unread badge is updated by the server over the socket)
export function useMarkRead() {
  const queryClient = useQueryClient();
  const read = useMutation({
    mutationFn: markNotificationRead,
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
  const readAll = useMutation({
    mutationFn: markAllNotificationsRead,
    onSettled: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
  return { read, readAll };
}

// Click on a notification: mark it read and open what it is about
export function useOpenNotification() {
  const navigate = useNavigate();
  const { mutate: markRead } = useMarkRead().read;
  return useCallback(
    (n: NotificationItem) => {
      if (!n.isRead) markRead(n.id);
      if (n.link) void navigate(n.link);
    },
    [navigate, markRead],
  );
}

// Server texts are English templates; known types get translated texts
export function useNotificationText() {
  const { t } = useTranslation();
  return useCallback(
    (n: Pick<NotificationItem, "type" | "title" | "message">) => ({
      title: t(`notificationTypes.${n.type}.title`, { defaultValue: n.title }),
      message: t(`notificationTypes.${n.type}.message`, { defaultValue: n.message }),
    }),
    [t],
  );
}

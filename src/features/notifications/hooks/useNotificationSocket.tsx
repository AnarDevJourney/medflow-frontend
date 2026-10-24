import { useQueryClient } from "@tanstack/react-query";
import { App } from "antd";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useSignOut } from "@features/auth/hooks/useAuthActions";
import { api } from "@lib/api/client";
import { useAppDispatch } from "@store/index";
import { setUnreadCount } from "@store/uiSlice";
import type { NotificationItem } from "../services/notificationsService";
import { notificationsKey, useNotificationText } from "./useNotifications";
import { NotificationIcon } from "../components/NotificationIcon";

type HandshakeError = Error & { data?: { code?: string } };

// One Socket.io connection per signed-in session (through the gateway,
// cookie auth). Server events (DOC 6.7):
//   notification       → toast + refresh the lists
//   notification:count → unread badge (the server owns the number)
//   session:expired    → the access token ran out: refresh, reconnect
//   session:revoked    → signed out elsewhere / password changed / deactivated
export function useNotificationSocket() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const signOut = useSignOut();
  const text = useNotificationText();
  const { notification } = App.useApp();

  // Latest handlers without reconnecting when they change (e.g. language)
  const handlers = useRef({ navigate, signOut, text, notification });
  useEffect(() => {
    handlers.current = { navigate, signOut, text, notification };
  });

  useEffect(() => {
    const socket = io({ path: "/socket.io", withCredentials: true, autoConnect: false });
    let refreshing = false;

    // New cookies, new socket — or the session is really over
    const refreshAndReconnect = async (reason?: "revoked") => {
      if (refreshing) return;
      refreshing = true;
      try {
        await api.post("/auth/refresh");
        socket.connect();
      } catch {
        void handlers.current.signOut({ callServer: false, reason });
      } finally {
        refreshing = false;
      }
    };

    socket.on("notification", (n: NotificationItem) => {
      void queryClient.invalidateQueries({ queryKey: notificationsKey });
      const { title, message } = handlers.current.text(n);
      handlers.current.notification.open({
        title,
        description: message,
        icon: <NotificationIcon type={n.type} urgent={n.isUrgent} />,
        duration: n.isUrgent ? 0 : 6, // urgent ones stay until closed
        onClick: () => n.link && void handlers.current.navigate(n.link),
      });
    });
    socket.on("notification:count", ({ count }: { count: number }) =>
      dispatch(setUnreadCount(count)),
    );
    socket.on("session:expired", () => void refreshAndReconnect());
    // After changing the own password this session got new cookies before
    // the event arrived → the refresh works and we simply reconnect
    socket.on("session:revoked", () => {
      socket.disconnect();
      void refreshAndReconnect("revoked");
    });
    // Rejected handshake (expired / revoked token): the client does not retry
    // by itself; network errors are retried automatically
    socket.on("connect_error", (error: HandshakeError) => {
      if (error.data?.code === "UNAUTHORIZED") void refreshAndReconnect();
    });

    socket.connect();
    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      dispatch(setUnreadCount(null));
    };
  }, [dispatch, queryClient]);
}

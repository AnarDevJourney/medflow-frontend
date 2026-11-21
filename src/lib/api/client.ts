import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type { ApiSuccess } from "@models/api";
import { toApiError } from "./errors";

// One Axios instance for the whole app. Auth is cookie-based (HttpOnly
// access_token / refresh_token set by the backend) — JS never sees a token.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Requests that must never trigger a silent refresh: they ARE the auth flow,
// and a 401 there is a real answer ("wrong password", "invalid link")
const NO_REFRESH = [
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/auth/accept-invite",
  "/auth/forgot-password",
  "/auth/reset-password",
];

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

// ─── 401 → refresh once → retry ──────────────────────────────────
// The access token lives 15 min. When a request gets 401, one refresh
// call rotates the cookies and every request that failed meanwhile waits
// for it, then retries. If the refresh fails the user is logged out —
// the auth guard reacts to the failed /auth/me and redirects to /login.
//
// A used refresh token presented again means theft to the server: it
// signs the user out everywhere. So refreshes must never overlap:
//   • one per tab — every caller (requests, the socket) shares one promise;
//   • one per browser — tabs take turns through a Web Lock, and a tab that
//     waited skips its own refresh when another tab just did it (the
//     cookies are shared, so the new ones are already there);
//   • a race that still slips through gets 409 ALREADY_REFRESHED from the
//     server (nothing revoked) and counts as done.
const LOCK = "medflow-auth-refresh";
const LAST_REFRESH_KEY = "medflow-auth-refreshed-at";

const readLastRefresh = (): number => {
  try {
    return Number(localStorage.getItem(LAST_REFRESH_KEY)) || 0;
  } catch {
    return 0; // storage blocked: every tab refreshes for itself
  }
};

const markRefreshed = () => {
  try {
    localStorage.setItem(LAST_REFRESH_KEY, String(Date.now()));
  } catch {
    // not shared with other tabs — the server's grace window covers it
  }
};

const callRefresh = async (startedAt: number): Promise<void> => {
  // Another tab refreshed after we noticed the expiry → cookies are new
  if (readLastRefresh() >= startedAt) return;
  try {
    await api.post("/auth/refresh");
    markRefreshed();
  } catch (error) {
    const body = (error as AxiosError<{ error?: { details?: { reason?: string } } }>)
      .response?.data;
    if (body?.error?.details?.reason === "ALREADY_REFRESHED") return;
    throw error;
  }
};

let refreshing: Promise<void> | null = null;

// The one way to refresh the session (the socket uses it too)
export const refreshSession = (): Promise<void> => {
  if (!refreshing) {
    const startedAt = Date.now();
    const run = () => callRefresh(startedAt);
    refreshing = (
      typeof navigator !== "undefined" && navigator.locks
        ? navigator.locks.request(LOCK, run)
        : run()
    ).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
};

api.interceptors.response.use(
  // Unwrap the envelope: callers get `data` itself
  (response) => {
    const body = response.data as ApiSuccess<unknown> | undefined;
    if (body && typeof body === "object" && "success" in body && body.success) {
      response.data = body.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const isAuthCall = NO_REFRESH.some((path) => config?.url?.startsWith(path));

    if (error.response?.status === 401 && config && !config._retry && !isAuthCall) {
      config._retry = true;
      try {
        await refreshSession();
      } catch (refreshError) {
        return Promise.reject(toApiError(refreshError));
      }
      return api(config);
    }
    return Promise.reject(toApiError(error));
  },
);

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
let refreshing: Promise<void> | null = null;

const refresh = () => {
  refreshing ??= api
    .post("/auth/refresh")
    .then(() => undefined)
    .finally(() => {
      refreshing = null;
    });
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
        await refresh();
      } catch (refreshError) {
        return Promise.reject(toApiError(refreshError));
      }
      return api(config);
    }
    return Promise.reject(toApiError(error));
  },
);

import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppSplash } from "@components/layout/AppSplash";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { ServerErrorPage } from "@features/errors/pages/ServerErrorPage";
import { isApiError } from "@lib/api/errors";
import { PATHS } from "./paths";

// Signed-in pages only. Not signed in (401 after the silent refresh) →
// /login, and back here after signing in.
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { data: user, error, refetch } = useCurrentUser();
  const location = useLocation();

  if (error) {
    if (isApiError(error) && error.status === 401) {
      const back = `${location.pathname}${location.search}`;
      const query = back === PATHS.home ? "" : `?redirect=${encodeURIComponent(back)}`;
      return <Navigate to={`${PATHS.login}${query}`} replace />;
    }
    return <ServerErrorPage error={error} onRetry={() => void refetch()} />;
  }
  if (!user) return <AppSplash />;
  return children ?? <Outlet />;
}

import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppSplash } from "@components/layout/AppSplash";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { ServerErrorPage } from "@features/errors/pages/ServerErrorPage";
import { useMyPermissions } from "@features/permissions/hooks/usePermissions";
import { isApiError } from "@lib/api/errors";
import { PATHS } from "./paths";

// Signed-in pages only. Not signed in (401 after the silent refresh) →
// /login, and back here after signing in. Pages render once the user's
// permissions are known too (menus and page guards need them).
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { data: user, error, refetch } = useCurrentUser();
  const permissions = useMyPermissions();
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
  if (permissions.error) {
    return (
      <ServerErrorPage
        error={permissions.error}
        onRetry={() => void permissions.refetch()}
      />
    );
  }
  if (!permissions.data) return <AppSplash />;
  return children ?? <Outlet />;
}

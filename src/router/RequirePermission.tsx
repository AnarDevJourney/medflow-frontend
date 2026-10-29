import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { ForbiddenPage } from "@features/errors/pages/ForbiddenPage";
import { useCan, type PermissionCheck } from "@features/permissions/hooks/usePermissions";

// Pages that need a permission (the same one the backend checks). Inside
// RequireAuth, so the user's permissions are already loaded.
export function RequirePermission({
  permission,
  children,
}: {
  permission: PermissionCheck | undefined;
  children?: ReactNode;
}) {
  const can = useCan();
  if (!can(permission)) return <ForbiddenPage />;
  return children ?? <Outlet />;
}

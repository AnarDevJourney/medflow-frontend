import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { ForbiddenPage } from "@features/errors/pages/ForbiddenPage";
import type { Role } from "@models/enums";

// Pages for some roles only (the same roles the backend allows). Inside
// RequireAuth, so the user is already known.
export function RequireRole({
  roles,
  children,
}: {
  roles: readonly Role[];
  children?: ReactNode;
}) {
  const { data: user } = useCurrentUser();
  if (!user) return null;
  if (!roles.includes(user.role)) return <ForbiddenPage />;
  return children ?? <Outlet />;
}

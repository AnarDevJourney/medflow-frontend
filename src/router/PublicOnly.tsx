import type { ReactNode } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import { safeRedirect } from "./safeRedirect";

// Login / forgot password: an already signed-in user goes straight in
export function PublicOnly({ children }: { children: ReactNode }) {
  const { data: user } = useCurrentUser();
  const [params] = useSearchParams();
  if (user) return <Navigate to={safeRedirect(params.get("redirect"))} replace />;
  return children;
}

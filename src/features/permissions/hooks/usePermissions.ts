import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useCurrentUser } from "@features/auth/hooks/useCurrentUser";
import type { Permission } from "@models/permissions";
import { getMyPermissions, getPermissionsMatrix } from "../services/permissionsService";

export const myPermissionsKey = (userId: string | undefined) =>
  ["permissions", "me", userId] as const;
export const permissionsMatrixKey = ["permissions", "matrix"] as const;

// The signed-in user's permissions. Changes arrive over Socket.io
// (permissions:updated), so the list never goes stale by itself.
export function useMyPermissions() {
  const { data: user } = useCurrentUser();
  return useQuery({
    queryKey: myPermissionsKey(user?.id),
    queryFn: getMyPermissions,
    enabled: !!user,
    staleTime: Infinity,
  });
}

// One permission or any of several. Only for showing / hiding UI — the
// backend checks every request itself.
export type PermissionCheck = Permission | readonly Permission[];

export function useCan() {
  const { data } = useMyPermissions();
  const granted = data?.permissions;
  return useCallback(
    (check: PermissionCheck | undefined) => {
      if (!check) return true;
      if (!granted) return false;
      const wanted: readonly Permission[] = typeof check === "string" ? [check] : check;
      return wanted.some((p) => granted.includes(p));
    },
    [granted],
  );
}

export function usePermissionsMatrix() {
  return useQuery({ queryKey: permissionsMatrixKey, queryFn: getPermissionsMatrix });
}

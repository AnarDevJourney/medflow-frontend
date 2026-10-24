import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { PATHS } from "@router/paths";
import { logout as logoutRequest, type CurrentUser } from "../services/authService";
import { currentUserQueryKey } from "./useCurrentUser";

// After a successful login / invite acceptance: drop everything cached for a
// previous user and start with the new one
export function useSignedIn() {
  const queryClient = useQueryClient();
  return useCallback(
    (user: CurrentUser) => {
      queryClient.clear();
      queryClient.setQueryData(currentUserQueryKey, user);
    },
    [queryClient],
  );
}

// Sign out: server call (best effort), then forget all cached data
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useCallback(
    async (options: { callServer?: boolean; reason?: "revoked" } = {}) => {
      if (options.callServer !== false) await logoutRequest().catch(() => undefined);
      queryClient.clear();
      void navigate(
        options.reason ? `${PATHS.login}?reason=${options.reason}` : PATHS.login,
        {
          replace: true,
        },
      );
    },
    [queryClient, navigate],
  );
}

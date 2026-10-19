import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../services/authService";

export const currentUserQueryKey = ["auth", "me"] as const;

// The signed-in user. TODO(F1): RequireAuth redirects to /login on 401.
export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
}

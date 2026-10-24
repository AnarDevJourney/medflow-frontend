import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../services/authService";

export const currentUserQueryKey = ["auth", "me"] as const;

// The signed-in user; RequireAuth sends a 401 to /login
export function useCurrentUser() {
  return useQuery({
    queryKey: currentUserQueryKey,
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
  });
}

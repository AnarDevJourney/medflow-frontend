import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api/errors";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      // 4xx answers are final; retry once on network / 5xx errors
      retry: (failureCount, error) => {
        const status = error instanceof ApiError ? error.status : 0;
        if (status >= 400 && status < 500) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: true,
    },
    mutations: { retry: false },
  },
});

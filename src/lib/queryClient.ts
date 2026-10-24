import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { store } from "@store/index";
import { setServiceUnavailable } from "@store/uiSlice";
import { ApiError } from "./api/errors";

// 503 (gateway: a service is down) or no answer at all → global retry
// banner; any successful request clears it again
const isUnavailable = (error: unknown) =>
  error instanceof ApiError && (error.status === 503 || error.status === 0);

const onError = (error: unknown) => {
  if (isUnavailable(error)) store.dispatch(setServiceUnavailable(true));
};
const onSuccess = () => {
  if (store.getState().ui.serviceUnavailable)
    store.dispatch(setServiceUnavailable(false));
};

export const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError, onSuccess }),
  mutationCache: new MutationCache({ onError, onSuccess }),
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

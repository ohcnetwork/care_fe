import careConfig from "@careConfig";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

import { handleHttpError } from "@/Utils/request/errorHandler";
import { HTTPError } from "@/Utils/request/types";

interface QueryMeta extends Record<string, unknown> {
  persist?: boolean;
}

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: HTTPError;
    queryMeta: QueryMeta;
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Only retry network errors or server errors (502, 503, 504) up to 3 times
        if (
          error.message === "Network Error" ||
          (error instanceof HTTPError && [502, 503, 504].includes(error.status))
        ) {
          return failureCount < 3;
        }
        return false;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      gcTime: careConfig.queryGcTime,
    },
  },
  queryCache: new QueryCache({
    onError: handleHttpError,
  }),
  mutationCache: new MutationCache({
    onError: handleHttpError,
  }),
});

export default queryClient;

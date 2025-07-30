import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

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
    },
  },
  queryCache: new QueryCache({
    onError: handleHttpError,
  }),
  mutationCache: new MutationCache({
    onError: handleHttpError,
  }),
});

const localStoragePersister = createAsyncStoragePersister({
  storage: window.localStorage,
  key: "care-query-cache",
});

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  dehydrateOptions: {
    shouldDehydrateQuery: ({ meta }) => meta?.persist === true,
  },
  buster: localStorage.getItem("app-version") ?? "0.0.0",
});

export function clearQueryPersistenceCache() {
  localStorage.removeItem("care-query-cache");
}

export default queryClient;

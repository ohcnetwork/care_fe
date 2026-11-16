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

/**
 * How long persisted queries (`meta.persist`) are kept, both in localStorage
 * and in memory. Persisted queries must set `gcTime` to at least this, or
 * they are garbage collected (and dropped from storage) before being reused.
 */
export const PERSISTED_QUERY_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      // Drop cached data as soon as a query has no observers, so a remount
      // never renders (and seeds state from) data that may be outdated.
      // Queries that rely on `staleTime` caching must set their own `gcTime`
      // (at least their `staleTime`).
      gcTime: 0,
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
});

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: PERSISTED_QUERY_MAX_AGE,
  dehydrateOptions: {
    shouldDehydrateQuery: ({ meta }) => meta?.persist === true,
  },
  // Restored queries have no observers yet; without this they'd inherit the
  // global gcTime of 0 and be collected before any component mounts.
  hydrateOptions: {
    defaultOptions: {
      queries: { gcTime: PERSISTED_QUERY_MAX_AGE },
    },
  },
  buster: localStorage.getItem("app-version") ?? "0.0.0",
});

export function clearQueryPersistenceCache() {
  queryClient.invalidateQueries({
    predicate: (query) => {
      return query.meta?.persist === true;
    },
  });
}

export default queryClient;

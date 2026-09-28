import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";

import { collectActionOutcomes } from "@/Utils/actions/actionOutcomes";
import { presentActionOutcomes } from "@/Utils/actions/presentActionOutcomes";
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
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
  queryCache: new QueryCache({
    onError: handleHttpError,
  }),
  mutationCache: new MutationCache({
    onError: handleHttpError,
    // Any write may come back with what the record's actions did (the
    // backend attaches `_actions` uniformly); one place shows them so no
    // page has to know which endpoints run actions. `onSettled`, not
    // `onSuccess`: query-core runs the cache's onSuccess BEFORE the
    // mutation's own, so the caller's success toast would land on top of
    // the outcomes. onSettled runs after it and the outcomes stack above.
    onSettled: (data, error) => {
      if (error) return;
      presentActionOutcomes(collectActionOutcomes(data));
    },
  }),
});

const localStoragePersister = createAsyncStoragePersister({
  storage: window.localStorage,
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
  queryClient.invalidateQueries({
    predicate: (query) => {
      return query.meta?.persist === true;
    },
  });
}

export default queryClient;

import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import {
  type Persister,
  persistQueryClient,
} from "@tanstack/react-query-persist-client";

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
  }),
});

const OFFLINE_CACHE_KEY = "REACT_QUERY_OFFLINE_CACHE";

// Wraps the browser storage so that a persister's writes can be neutralized
// once it has been retired. The async-storage persister throttles saves, so a
// save queued before logout can otherwise fire *after* the cache is cleared and
// rewrite the just-removed data back into storage.
function createGuardedPersister() {
  let active = true;
  const persister = createAsyncStoragePersister({
    storage: {
      getItem: (key) => window.localStorage.getItem(key),
      setItem: (key, value) => {
        if (active) {
          window.localStorage.setItem(key, value);
        }
      },
      removeItem: (key) => window.localStorage.removeItem(key),
    },
    key: OFFLINE_CACHE_KEY,
  });
  return {
    persister,
    // Permanently blocks this persister's saves; pending throttled writes
    // become no-ops. Removals are still honoured so the cache can be cleared.
    disableWrites: () => {
      active = false;
    },
  };
}

function subscribePersistence(persister: Persister): () => void {
  return persistQueryClient({
    queryClient,
    persister,
    dehydrateOptions: {
      shouldDehydrateQuery: ({ meta }) => meta?.persist === true,
    },
    buster: localStorage.getItem("app-version") ?? "0.0.0",
  })[0];
}

let guardedPersister = createGuardedPersister();
let unsubscribePersistence = subscribePersistence(guardedPersister.persister);

export async function clearQueryPersistenceCache(): Promise<void> {
  // Retire the current persister (blocking any pending throttled save) and stop
  // its subscription before touching the cache, so nothing can rewrite the
  // cleared data back into storage and briefly restore it after logout.
  guardedPersister.disableWrites();
  unsubscribePersistence();

  queryClient.removeQueries({
    predicate: (query) => query.meta?.persist === true,
  });
  window.localStorage.removeItem(OFFLINE_CACHE_KEY);

  // Start a fresh persister/subscription so subsequent logins in the same tab
  // persist again.
  guardedPersister = createGuardedPersister();
  unsubscribePersistence = subscribePersistence(guardedPersister.persister);
}

export default queryClient;

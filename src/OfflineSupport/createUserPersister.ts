import {
  PersistQueryClientOptions,
  PersistedClient,
} from "@tanstack/react-query-persist-client";

import { AppCacheDB, QueryCacheEntry } from "./AppcacheDB";

export const createUserPersister =
  (): PersistQueryClientOptions["persister"] => {
    const db = new AppCacheDB();
    const CACHE_KEY = "REACT_QUERY";

    return {
      async persistClient(client: unknown) {
        try {
          const cacheEntry: QueryCacheEntry = {
            cacheKey: CACHE_KEY,
            data: client,
            timestamp: Date.now(),
          };
          await db.querycache.put(cacheEntry);
        } catch (error) {
          console.error(
            "[persistClient] Failed to persist query client",
            error,
          );
        }
      },
      async restoreClient(): Promise<PersistedClient | undefined> {
        try {
          const entry = await db.querycache.get(CACHE_KEY);
          return entry?.data as PersistedClient;
        } catch {
          return undefined;
        }
      },
      async removeClient() {
        try {
          await db.querycache.clear();
        } catch (error) {
          console.error(
            "[removeClient] Failed to remove cached query client",
            error,
          );
        }
      },
    };
  };

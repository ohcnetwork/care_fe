import {
  PersistQueryClientOptions,
  PersistedClient,
} from "@tanstack/query-persist-client-core";
import Dexie from "dexie";

export class AppCacheDB extends Dexie {
  queryCache!: Dexie.Table<
    {
      cacheKey: string;
      data: unknown;
      timestamp: number;
    },
    string
  >;

  offlineWrites!: Dexie.Table<
    {
      id: string;
      userId: string;
      syncrouteKey: string;
      resourceType?: string;
      pathParams?: Record<string, any>;
      payload: unknown;
      clientTimestamp: number;
      serverTimestamp?: string;
      lastAttemptAt?: number;
      syncStatus: "pending" | "success" | "failed" | "conflict";
      lastError?: string;
      retries?: number;
      conflictData?: unknown;
      queryrouteKey?: string;
      queryParams?: Record<string, any>;
    },
    string
  >;

  constructor() {
    super("AppQueryCache");
    this.version(1).stores({
      queryCache: "cacheKey, timestamp",
    });

    this.version(2).stores({
      queryCache: "cacheKey, timestamp",
      offlineWrites: "id, userId, routeKey, timestamp",
    });
  }
}

export const createUserPersister = () => {
  const db = new AppCacheDB();
  const CACHE_KEY = `REACT_QUERY`;

  return {
    async persistClient(client: unknown) {
      await db.queryCache.put({
        cacheKey: CACHE_KEY,
        data: client,
        timestamp: Date.now(),
      });
    },

    async restoreClient(): Promise<PersistedClient | undefined> {
      try {
        const entry = await db.queryCache.get(CACHE_KEY);
        return entry?.data as PersistedClient;
      } catch {
        return undefined;
      }
    },

    async removeClient() {
      await db.queryCache.delete(CACHE_KEY);
    },
  } satisfies PersistQueryClientOptions["persister"];
};

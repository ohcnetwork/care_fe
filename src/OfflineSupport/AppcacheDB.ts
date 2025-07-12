import Dexie from "dexie";

export interface QueryCacheEntry {
  cacheKey: string;
  data: unknown;
  timestamp: number;
}

export interface OfflineWritesEntry {
  id: string;
  userId: string;
  mutationSyncRouteKey: string;
  type?: string;
  resourceType?: string;
  mutationPathParams?: Record<string, any>;
  mutationQueryParams?: Record<string, any>;
  payload: unknown;
  response?: unknown;
  parentMutationIds?: string[];
  clientTimestamp: number;
  serverTimestamp?: string;
  lastAttemptAt?: number;
  syncStatus: "pending" | "success" | "failed" | "conflict";
  lastError?: string;
  retries?: number;
  conflictData?: unknown;
  useQueryRouteKey?: string;
  useQueryPathParams?: Record<string, any>;
  useQueryParams?: Record<string, any>;
}

export class AppCacheDB extends Dexie {
  querycache!: Dexie.Table<QueryCacheEntry, string>;
  OfflineWrites!: Dexie.Table<OfflineWritesEntry, string>;
  constructor() {
    super("AppCacheDB");
    this.version(2).stores({
      querycache: "cacheKey, timestamp",
      OfflineWrites:
        "id, userId, type, resourceType, mutationSyncRouteKey, syncStatus, clientTimestamp, retries",
    });
  }
}

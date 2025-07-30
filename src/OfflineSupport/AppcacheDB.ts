import Dexie from "dexie";

import { OfflineKey } from "./offlineKeys";

export interface QueryCacheEntry {
  cacheKey: string;
  data: unknown;
  timestamp: number;
}

export interface OfflineWritesEntry {
  id: string;
  userId: string;
  mutationSyncRouteKey: OfflineKey;
  type: OfflineKey;
  resourceType?: string;
  mutationPathParams?: Record<string, any>;
  mutationQueryParams?: Record<string, any>;
  payload: unknown;
  response?: unknown;
  parentMutationIds?: string[];
  clientTimestamp: number;
  serverTimestamp?: string;
  lastAttemptAt?: number;
  syncStatus: "pending" | "success" | "failed" | "conflict" | "blocked";
  lastError?: string;
  lastErrorDetails?: unknown;
  retries?: number;
  conflictData?: unknown;
  useQueryRouteKey?: string;
  useQueryPathParams?: Record<string, any>;
  useQueryParams?: Record<string, any>;
  isPermanentFailure?: boolean;
}

export class AppCacheDB extends Dexie {
  querycache!: Dexie.Table<QueryCacheEntry, string>;
  OfflineWrites!: Dexie.Table<OfflineWritesEntry, string>;
  constructor() {
    super("AppCacheDB");
    this.version(3).stores({
      querycache: "cacheKey, timestamp",
      OfflineWrites:
        "id, userId, type, resourceType, mutationSyncRouteKey, syncStatus, clientTimestamp, retries",
    });
  }
}

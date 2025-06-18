import Dexie from "dexie";

export interface QueryCacheEntry {
  cacheKey: string;
  data: unknown;
  timestamp: number;
}

export interface OfflineWritesEntry {
  id: string;
  userId: string;
  syncrouteKey: string;
  type?: string;
  resourceType?: string;
  pathParams?: Record<string, any>;
  payload: unknown;
  response?: unknown;
  parentMutationIds?: string[];
  dependentFields?: Array<{
    parentId: string;
    childField: string;
    parentField: string;
  }>;
  clientTimestamp: number;
  serverTimestamp?: string;
  lastAttemptAt?: number;
  syncStatus: "pending" | "success" | "failed" | "conflict";
  lastError?: string;
  retries?: number;
  conflictData?: unknown;
  queryrouteKey?: string;
  queryParams?: Record<string, any>;
}

export class AppCacheDB extends Dexie {
  querycache!: Dexie.Table<QueryCacheEntry, string>;
  OfflineWrites!: Dexie.Table<OfflineWritesEntry, string>;
  constructor() {
    super("AppCacheDB");
    this.version(2).stores({
      querycache: "cacheKey, timestamp",
      OfflineWrites:
        "id, userId, type , resourceType, syncrouteKey, syncStatus, clientTimestamp , retries ",
    });
  }
}

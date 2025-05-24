import Dexie from "dexie";

export class AppCacheDB extends Dexie {
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
      offlineWrites: "id, userId, routeKey, timestamp",
    });
  }
}

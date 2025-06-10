import Dexie from "dexie";

export interface QueryCacheEntry {
  cacheKey: string;
  data: unknown;
  timestamp: number;
}

export class AppCacheDB extends Dexie {
  querycache!: Dexie.Table<QueryCacheEntry, string>;

  constructor() {
    super("AppCacheDB");
    this.version(1).stores({
      querycache: "cacheKey, timestamp",
    });
  }
}

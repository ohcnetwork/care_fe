import { v4 as uuidv4 } from "uuid";

import { AppCacheDB } from "./dexiepersister";

const db = new AppCacheDB();

interface SaveOfflineWriteParams {
  userId: string;
  syncrouteKey: string;
  payload: unknown;
  pathParams?: Record<string, any>;
  resourceType?: string;
  serverTimestamp?: string;
  queryrouteKey?: string;
  queryParams?: Record<string, any>;
}

export const saveOfflineWrite = async ({
  userId,
  syncrouteKey,
  payload,
  pathParams,
  resourceType,
  serverTimestamp,
  queryParams,
  queryrouteKey,
}: SaveOfflineWriteParams) => {
  const writeEntry = {
    id: uuidv4(),
    userId,
    syncrouteKey,
    payload,
    pathParams,
    resourceType,
    clientTimestamp: Date.now(),
    serverTimestamp,
    syncStatus: "pending" as const,
    retries: 0,
    queryParams,
    queryrouteKey,
  };

  try {
    await db.offlineWrites.add(writeEntry);
    console.log("Offline write saved successfully:", writeEntry);
  } catch (error) {
    console.error(" Failed to save offline write:", error);
  }
};

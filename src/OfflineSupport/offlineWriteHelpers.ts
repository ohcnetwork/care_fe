import { OfflineWritesEntry } from "./AppcacheDB";
import { AppCacheDB } from "./AppcacheDB";

export type SaveOfflineWriteResult =
  | { success: true; entry: OfflineWritesEntry }
  | { success: false; error: string };

export type saveOfflineWriteData = {
  id: string;
  userId: string;
  syncrouteKey: string;
  type?: string;
  resourceType?: string;
  pathParams?: Record<string, any>;
  payload: unknown;
  parentMutationIds?: string[];
  dependentFields?: Array<{
    parentId: string;
    childField: string;
    parentField: string;
  }>;
  serverTimestamp?: string;
  queryrouteKey?: string;
  queryParams?: Record<string, any>;
};
const db = new AppCacheDB();
export const saveOfflineWrite = async ({
  id,
  userId,
  syncrouteKey,
  type,
  resourceType,
  pathParams,
  payload,
  parentMutationIds,
  dependentFields,
  serverTimestamp,
  queryrouteKey,
  queryParams,
}: saveOfflineWriteData): Promise<SaveOfflineWriteResult> => {
  const writeEntry = {
    id,
    userId,
    syncrouteKey,
    type,
    resourceType,
    pathParams,
    payload,
    parentMutationIds,
    dependentFields,
    clientTimestamp: Date.now(),
    serverTimestamp,
    syncStatus: "pending" as const,
    retries: 0,
    queryrouteKey,
    queryParams,
  };
  try {
    await db.OfflineWrites.add(writeEntry);
    return { success: true, entry: writeEntry };
  } catch (error) {
    console.error("Failed to save offline write:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
};

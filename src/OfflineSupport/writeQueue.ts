import { AppCacheDB, OfflineWritesEntry } from "./AppcacheDB";

// You should import or define OfflineWriteRecord type from your codebase
// import { OfflineWriteRecord } from "./types";

const db = new AppCacheDB();
const MAX_RETRIES = 5;

/**
 * Load all pending and retryable writes for a user.
 */
export async function getPendingAndRetryableWrites(
  userId: string,
): Promise<OfflineWritesEntry[]> {
  return db.OfflineWrites.where("userId")
    .equals(userId)
    .and((w) => {
      const isPending = w.syncStatus === "pending";
      const isFailedButRetryable =
        w.syncStatus === "failed" && (w.retries || 0) < MAX_RETRIES;
      return isPending || isFailedButRetryable;
    })
    .toArray();
}

/**
 * Update the status (and optionally other fields) of a write.
 */
export async function markWriteStatus(
  writeId: string,
  status: OfflineWritesEntry["syncStatus"],
  extra?: Partial<OfflineWritesEntry>,
): Promise<void> {
  await db.OfflineWrites.update(writeId, {
    syncStatus: status,
    ...(extra || {}),
  });
}

/**
 * Placeholder for cleaning up old successful/failed writes.
 * Implement this function later as needed.
 */
// export async function cleanupSuccessfulWrites(userId: string, olderThanMs: number): Promise<void> {
//   // TODO: Implement cleanup logic
// }

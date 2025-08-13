import { AppCacheDB, OfflineWritesEntry } from "./AppcacheDB";
import { dependencySchema } from "./dependencySchema";
import { replaceOfflineIdsInWrite } from "./idReplacer";

const db = new AppCacheDB();
const MAX_RETRIES = 5;

export async function getPendingAndRetryableWrites(
  userId: string,
  facilityId?: string,
): Promise<OfflineWritesEntry[]> {
  let query = db.OfflineWrites.where("userId").equals(userId);
  console.log("facilityId", facilityId);
  console.log("userId", userId);
  if (facilityId) {
    query = query.and((w) => w.facilityId === facilityId);
  }
  console.log("query", query);
  return query
    .and((w) => {
      const isPending = w.syncStatus === "pending";
      const isFailedButRetryable =
        w.syncStatus === "failed" && (w.retries || 0) < MAX_RETRIES;

      return isPending || isFailedButRetryable;
    })
    .toArray();
}

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

export async function processDependentWrites(
  succeededParentId: string,
): Promise<void> {
  const allWrites = await db.OfflineWrites.toArray();
  const dependentWrites = allWrites.filter((write: OfflineWritesEntry) => {
    return write.parentMutationId === succeededParentId;
  });

  for (const dependent of dependentWrites) {
    if (dependent.syncStatus === "blocked") {
      try {
        const processedWrite = await replaceOfflineIdsInWrite(
          dependent,
          dependencySchema,
        );

        await db.OfflineWrites.update(dependent.id, processedWrite);
      } catch (error) {
        console.error(
          `Failed to replace offline IDs in write ${dependent.id}:`,
          error,
        );
      }

      await markWriteStatus(dependent.id, "pending", {
        lastError: undefined,
        lastErrorDetails: undefined,
        lastAttemptAt: undefined,
      });
    }
  }
}

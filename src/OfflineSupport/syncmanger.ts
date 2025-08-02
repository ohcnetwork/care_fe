import { onlineManager } from "@tanstack/react-query";
import { toast } from "sonner";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { ApiRoute, HTTPError } from "@/Utils/request/types";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";
import scheduleApis from "@/types/scheduling/scheduleApi";

import { AppCacheDB } from "./AppcacheDB";
import { detectAndMarkConflict } from "./conflictHandler";
import { topologicalSort } from "./dependencyResolver";
import { dependencySchema } from "./dependencySchema";
import { IdMap } from "./idMap";
import { replaceOfflineIdsInWrite } from "./idReplacer";
import { OfflineKey } from "./offlineKeys";
import {
  getPendingAndRetryableWrites,
  markWriteStatus,
  unblockDependentWrites,
} from "./writeQueue";

export const mutationMap = {
  create_patient: patientApi.addPatient,
  update_patient: patientApi.updatePatient,
  create_encounter: encounterApi.create,
  mark_encounter_as_complete: encounterApi.update,
  create_resource_request: routes.createResource,
  update_resource_request: routes.updateResource,
  assign_user_to_patient: patientApi.addUser,
  remove_user_from_patient: patientApi.removeUser,
  create_appointment: scheduleApis.slots.createAppointment,
  reschedule_appointment: scheduleApis.appointments.reschedule,
  update_appointment_status: scheduleApis.appointments.update,
  cancel_appointment: scheduleApis.appointments.cancel,
  non_structured_questionnaire: routes.batchRequest,
  update_encounter_questionnair: routes.batchRequest,
  structured_questionnair: routes.batchRequest,
} satisfies Record<OfflineKey, ApiRoute<any, any>>;

interface SyncManagerOptions {
  userId: string;
  maxRetries?: number;
  retryDelayMs?: number;
  enableConflictDetection?: boolean;
  onProgress?: (syncedCount: number, totalCount: number) => void;
  onSyncStart?: (totalCount: number) => void;
  onSyncComplete?: () => void;
}

interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  conflictCount: number;
  blockedCount: number;
  errors: string[];
}

export class SyncManager {
  private idMap: IdMap;
  private isRunning = false;
  private abortController: AbortController | null = null;

  constructor(private options: SyncManagerOptions) {
    this.idMap = new IdMap();
  }

  // Main sync loop that start the entire sync process

  async sync(): Promise<SyncResult> {
    if (this.isRunning) {
      throw new Error("Sync is already running");
    }

    if (!onlineManager.isOnline()) {
      throw new Error("Cannot sync while offline");
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      conflictCount: 0,
      blockedCount: 0,
      errors: [],
    };

    try {
      // Step 1: Get pending writes
      const pendingWrites = await getPendingAndRetryableWrites(
        this.options.userId,
      );

      if (pendingWrites.length === 0) {
        return result;
      }

      // Step 2: Pre-populate IdMap with all successful sync records
      // Get ALL writes (including successful ones) to build the mapping
      const db = new AppCacheDB();
      const allWrites = await db.OfflineWrites.where("userId")
        .equals(this.options.userId)
        .toArray();

      const successfulWrites = allWrites.filter(
        (write) => write.syncStatus === "success",
      );
      this.idMap.prePopulateFromSuccessfulSyncs(successfulWrites);

      // Debug: Show available mappings
      const allMappings = this.idMap.getAllMappings();
      console.log(`Available ID mappings for this sync session:`, allMappings);

      // Step 3: Sort by dependencies (topological sort)
      const sortedWrites = topologicalSort(pendingWrites);
      const totalWrites = sortedWrites.length;

      // Notify that sync is starting with pending writes
      this.options.onSyncStart?.(totalWrites);

      // Step 4: Process writes in dependency order
      for (let i = 0; i < sortedWrites.length; i++) {
        const write = sortedWrites[i];

        if (this.abortController?.signal.aborted) {
          break;
        }

        // Add 1 second delay for testing banner visibility
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const writeResult = await this.processWrite(write);

        switch (writeResult.status) {
          case "success":
            result.syncedCount++;
            break;
          case "failed":
            result.failedCount++;
            if (writeResult.error) {
              result.errors.push(writeResult.error);
            }
            break;
          case "conflict":
            result.conflictCount++;
            break;
          case "blocked":
            result.blockedCount++;
            break;
        }

        // Report progress
        this.options.onProgress?.(
          result.syncedCount +
            result.failedCount +
            result.conflictCount +
            result.blockedCount,
          totalWrites,
        );
      }

      // Step 5: Cleanup and finalize
      await this.cleanup();
    } catch (error) {
      result.success = false;
      result.errors.push(
        error instanceof Error ? error.message : "Unknown error",
      );
      console.error("Sync failed:", error);
    } finally {
      this.isRunning = false;
      this.abortController = null;
      this.options.onSyncComplete?.();
    }

    return result;
  }

  /// Process a single write through the sync pipeline

  private async processWrite(write: any): Promise<{
    status: "success" | "failed" | "conflict" | "blocked";
    error?: string;
  }> {
    try {
      // Step 1: Check if parent writes are blocked
      if (write.parentMutationIds?.length > 0) {
        const blockedParents = await this.checkBlockedParents(
          write.parentMutationIds,
        );
        if (blockedParents.length > 0) {
          return { status: "blocked" };
        }
      }

      // Step 2: Conflict detection (if enabled)
      if (this.options.enableConflictDetection && write.useQueryRouteKey) {
        const hasConflict = await detectAndMarkConflict(write);
        if (hasConflict) {
          return { status: "conflict" };
        }
      }

      // Step 3: Replace offline IDs with server IDs
      const processedWrite = replaceOfflineIdsInWrite(
        write,
        dependencySchema,
        this.idMap,
      );

      // Step 4: Execute the mutation
      const response = await this.executeMutation(processedWrite);

      // Step 5: Update write status and store mapping
      await markWriteStatus(write.id, "success", {
        response,
        lastAttemptAt: Date.now(),
      });

      // Step 6: Add ID mapping if this was a creation
      if (response?.id && write.id.startsWith("offline-")) {
        this.idMap.addMapping(write.id, response.id);
      }

      // Step 7: Unblock dependent writes that were blocked by this write
      await unblockDependentWrites(write.id);

      return { status: "success" };
    } catch (error) {
      // Store the complete error information
      let errorMessage = "Unknown error";
      let errorDetails = error;

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      if (error instanceof HTTPError) {
        // For HTTP errors, store both the error object and the cause
        errorDetails = {
          error: error,
          cause: error.cause,
          status: error.status,
          message: error.message,
        };
      }

      toast.error(`Failed to sync write ${write.type}`);

      // Determine if this is a permanent failure
      const isPermanentFailure = this.isPermanentFailure(error);

      await markWriteStatus(write.id, "failed", {
        lastError: errorMessage,
        lastErrorDetails: errorDetails,
        lastAttemptAt: Date.now(),
        retries: (write.retries || 0) + 1,
        isPermanentFailure,
      });

      // If permanent failure, mark all dependent writes as blocked
      if (isPermanentFailure) {
        await this.markDependentWritesAsBlocked(write.id);
      }

      return { status: "failed", error: errorMessage };
    }
  }

  // Execute the actual API mutation

  private async executeMutation(write: any): Promise<any> {
    const route = mutationMap[write.type as keyof typeof mutationMap];

    if (!route) {
      throw new Error(`Unknown mutation type: ${write.type}`);
    }

    const runMutation = mutate(route, {
      pathParams: write.mutationPathParams,
      queryParams: write.mutationQueryParams,
    });

    const response = await runMutation(write.payload);
    return response;
  }

  // Check if any parent writes are permanently failed

  private async checkBlockedParents(parentIds: string[]): Promise<string[]> {
    const db = new AppCacheDB();
    const blockedParents: string[] = [];

    for (const parentId of parentIds) {
      const parent = await db.OfflineWrites.get(parentId);
      if (parent?.isPermanentFailure) {
        blockedParents.push(parentId);
      }
    }

    return blockedParents;
  }

  // Mark all dependent writes as blocked when a parent fails permanently

  private async markDependentWritesAsBlocked(
    failedParentId: string,
  ): Promise<void> {
    const db = new AppCacheDB();

    const allWrites = await db.OfflineWrites.toArray();
    const dependentWrites = allWrites.filter((write) => {
      return write.parentMutationIds?.includes(failedParentId) || false;
    });

    for (const dependent of dependentWrites) {
      await markWriteStatus(dependent.id, "blocked", {
        lastError: `Blocked by failed parent: ${failedParentId}`,
        lastErrorDetails: {
          blockedBy: failedParentId,
          reason: "parent_failed",
        },
        lastAttemptAt: Date.now(),
      });
    }
  }

  //  check if an error is permanent (should not retry)

  private isPermanentFailure(error: any): boolean {
    if (error instanceof HTTPError) {
      const statusCode = error.status;

      // 4xx errors are usually permanent (except 429 - rate limit)
      if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        return true;
      }

      // 5xx errors might be temporary, but some are permanent
      if (statusCode >= 500) {
        // Consider 501, 502, 503 as temporary, others as permanent
        return ![501, 502, 503].includes(statusCode);
      }
    }

    return false;
  }

  //  Cleanup after sync

  private async cleanup(): Promise<void> {
    // TODO: Implement cleanup logic
    console.log("cleanup");
  }

  stop(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  isSyncRunning(): boolean {
    return this.isRunning;
  }
}

// Convenience function to run a one-time sync

export async function syncOfflineRecords(
  userId: string,
  onProgress?: (syncedCount: number, totalCount: number) => void,
  onSyncStart?: (totalCount: number) => void,
  onSyncComplete?: () => void,
): Promise<SyncResult> {
  const syncManager = new SyncManager({
    userId,
    maxRetries: 3,
    retryDelayMs: 1000,
    enableConflictDetection: true,
    onProgress,
    onSyncStart,
    onSyncComplete,
  });

  return syncManager.sync();
}

/**
 * Create a persistent sync manager instance for ongoing sync operations
 */
// export function createSyncManager(userId: string, options?: Partial<SyncManagerOptions>): SyncManager {
//   return new SyncManager({
//     userId,
//     maxRetries: 3,
//     retryDelayMs: 1000,
//     enableConflictDetection: true,
//     ...options,
//   });
// }

/**
 * Example usage:
 *
 * // One-time sync
 * const result = await syncOfflineRecords(userId);
 * console.log(`Synced ${result.syncedCount} records`);
 *
 * // Persistent sync manager
 * const syncManager = createSyncManager(userId);
 *
 * // Start sync
 * const result = await syncManager.sync();
 *
 * // Check if running
 * if (syncManager.isSyncRunning()) {
 *   console.log("Sync in progress...");
 * }
 *
 * // Stop sync
 * syncManager.stop();
 */

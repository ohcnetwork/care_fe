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
import { replaceOfflineIdsInWrite } from "./idReplacer";
import { OfflineKey } from "./offlineKeys";
import {
  getPendingAndRetryableWrites,
  markWriteStatus,
  processDependentWrites,
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
  facilityId?: string;
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
  private isRunning = false;
  private abortController: AbortController | null = null;

  constructor(private options: SyncManagerOptions) {}

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
        this.options.facilityId, // Pass facilityId if provided
      );

      if (pendingWrites.length === 0) {
        return result;
      }

      // Step 2: No need to pre-populate IdMap - each write will find its own parent mappings

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
        await new Promise((resolve) => setTimeout(resolve, 500));

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

  // Public method to process a single write
  public async processSingleWrite(write: any): Promise<{
    status: "success" | "failed" | "conflict" | "blocked";
    error?: string;
  }> {
    return this.processWrite(write);
  }

  // Process a single write through the sync pipeline

  private async processWrite(write: any): Promise<{
    status: "success" | "failed" | "conflict" | "blocked";
    error?: string;
  }> {
    try {
      // Step 1: Check if parent writes are blocked
      if (write.parentMutationId) {
        const isParentBlocked = await this.checkBlockedParents(
          write.parentMutationId,
        );
        if (isParentBlocked) {
          // Mark the child as blocked in the database
          await markWriteStatus(write.id, "blocked", {
            lastError: `Blocked by failed/blocked parent: ${write.parentMutationId}`,
            lastErrorDetails: {
              blockedBy: write.parentMutationId,
              reason: "parent_failed_or_blocked",
            },
            lastAttemptAt: Date.now(),
          });
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
      const processedWrite = await replaceOfflineIdsInWrite(
        write,
        dependencySchema,
      );

      // Step 4: Execute the mutation
      const response = await this.executeMutation(processedWrite);

      // Step 5: Update write status and store mapping
      await markWriteStatus(write.id, "success", {
        response,
        lastAttemptAt: Date.now(),
      });

      // Step 6: Unblock dependent writes that were blocked by this write
      await processDependentWrites(write.id);

      return { status: "success" };
    } catch (error) {
      console.log("error is here", error);
      toast.error(`Failed to sync write ${write.type}`);

      let errorMessage = "Unknown error";
      let serverResponse: any = null;
      console.log("error", error);
      if (error instanceof HTTPError) {
        serverResponse = error.cause;
        errorMessage =
          serverResponse?.errors?.[0]?.msg || error.message || "Unknown error";
      }
      // Determine if this is a permanent failure
      const isPermanentFailure = this.isPermanentFailure(error);

      await markWriteStatus(write.id, "failed", {
        lastError: errorMessage,
        lastErrorDetails: serverResponse,
        lastAttemptAt: Date.now(),
        retries: (write.retries || 0) + 1,
        isPermanentFailure,
      });

      // Mark all dependent writes as blocked for ANY failure
      await this.markDependentWritesAsBlocked(write.id);

      return { status: "failed", error: errorMessage };
    }
  }

  // Execute the actual API mutation

  private async executeMutation(write: any): Promise<any> {
    const route = mutationMap[write.type as keyof typeof mutationMap];

    if (!route) {
      throw new Error(`Unknown mutation type: ${write.type}`);
    }

    // Validate payload before sending
    if (!write.payload) {
      throw new Error(`Missing payload for write type: ${write.type}`);
    }

    const runMutation = mutate(route, {
      pathParams: write.mutationPathParams,
      queryParams: write.mutationQueryParams,
    });

    const response = await runMutation(write.payload);
    return response;
  }

  // Check if parent write is failed (permanently or temporarily)
  private async checkBlockedParents(parentId: string): Promise<boolean> {
    const db = new AppCacheDB();
    const parent = await db.OfflineWrites.get(parentId);

    // Return true if parent is failed (permanently OR temporarily failure)
    return parent?.syncStatus === "failed";
  }

  // Mark all dependent writes as blocked when a parent fails (permanently or temporarily)

  private async markDependentWritesAsBlocked(
    failedParentId: string,
  ): Promise<void> {
    const db = new AppCacheDB();

    const allWrites = await db.OfflineWrites.toArray();
    const dependentWrites = allWrites.filter((write) => {
      return write.parentMutationId === failedParentId;
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
    try {
      const db = new AppCacheDB();
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      let query = db.OfflineWrites.where("userId").equals(this.options.userId);

      // If facilityId is provided, filter by facilityId for cleanup
      if (this.options.facilityId) {
        query = query.and((w) => w.facilityId === this.options.facilityId);
      }

      const oldSuccessfulWrites = await query
        .and(
          (w) =>
            w.syncStatus === "success" && w.clientTimestamp < thirtyDaysAgo,
        )
        .toArray();

      for (const write of oldSuccessfulWrites) {
        await db.OfflineWrites.delete(write.id);
      }
    } catch (error) {
      console.error("Cleanup failed:", error);
    }
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

//  function to run a one-time sync

export async function syncOfflineRecords(
  userId: string,
  onProgress?: (syncedCount: number, totalCount: number) => void,
  onSyncStart?: (totalCount: number) => void,
  onSyncComplete?: () => void,
  facilityId?: string, // Add optional facilityId parameter
): Promise<SyncResult> {
  const syncManager = new SyncManager({
    userId,
    facilityId, // Pass facilityId to SyncManager
    maxRetries: 3,
    retryDelayMs: 1000,
    enableConflictDetection: true,
    onProgress,
    onSyncStart,
    onSyncComplete,
  });

  return syncManager.sync();
}

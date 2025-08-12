import { onlineManager } from "@tanstack/react-query";
import { toast } from "sonner";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { ApiRoute, HTTPError } from "@/Utils/request/types";
import batchApi from "@/types/base/batch/batchApi";
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
  non_structured_questionnaire: batchApi.batchRequest,
  update_encounter_questionnaire: batchApi.batchRequest,
  structured_questionnair: batchApi.batchRequest,
  allergy_intolerance: batchApi.batchRequest,
  diagnosis: batchApi.batchRequest,
  medication_request: batchApi.batchRequest,
  medication_statement: batchApi.batchRequest,
  symptom: batchApi.batchRequest,
  encounter: batchApi.batchRequest,
  appointment: batchApi.batchRequest,
  files: batchApi.batchRequest,
  time_of_death: batchApi.batchRequest,
  charge_item: batchApi.batchRequest,
  service_request: batchApi.batchRequest,
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

  constructor(private options: SyncManagerOptions) { }



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

      const pendingWrites = await getPendingAndRetryableWrites(
        this.options.userId,
        this.options.facilityId,
      );

      if (pendingWrites.length === 0) {
        return result;
      }


      const sortedWrites = topologicalSort(pendingWrites);
      const totalWrites = sortedWrites.length;

      this.options.onSyncStart?.(totalWrites);


      for (let i = 0; i < sortedWrites.length; i++) {
        const write = sortedWrites[i];

        if (this.abortController?.signal.aborted) {
          break;
        }


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


        this.options.onProgress?.(
          result.syncedCount +
          result.failedCount +
          result.conflictCount +
          result.blockedCount,
          totalWrites,
        );
      }


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


  public async processSingleWrite(write: any): Promise<{
    status: "success" | "failed" | "conflict" | "blocked";
    error?: string;
  }> {
    return this.processWrite(write);
  }



  private async processWrite(write: any): Promise<{
    status: "success" | "failed" | "conflict" | "blocked";
    error?: string;
  }> {
    try {

      if (write.parentMutationId) {
        const isParentBlocked = await this.checkBlockedParents(
          write.parentMutationId,
        );
        if (isParentBlocked) {

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


      if (this.options.enableConflictDetection && write.useQueryRouteKey) {
        const hasConflict = await detectAndMarkConflict(write);
        if (hasConflict) {
          return { status: "conflict" };
        }
      }


      const processedWrite = await replaceOfflineIdsInWrite(
        write,
        dependencySchema,
      );


      const response = await this.executeMutation(processedWrite);


      await markWriteStatus(write.id, "success", {
        response,
        lastAttemptAt: Date.now(),
      });


      await processDependentWrites(write.id);

      return { status: "success" };
    } catch (error) {

      toast.error(`Failed to sync write ${write.type}`);

      let errorMessage = "Unknown error";
      let serverResponse: any = null;

      if (error instanceof HTTPError) {
        serverResponse = error.cause;
        errorMessage =
          serverResponse?.errors?.[0]?.msg || error.message || "Unknown error";
      }

      const isPermanentFailure = this.isPermanentFailure(error);

      await markWriteStatus(write.id, "failed", {
        lastError: errorMessage,
        lastErrorDetails: serverResponse,
        lastAttemptAt: Date.now(),
        retries: (write.retries || 0) + 1,
        isPermanentFailure,
      });


      await this.markDependentWritesAsBlocked(write.id);

      return { status: "failed", error: errorMessage };
    }
  }



  private async executeMutation(write: any): Promise<any> {
    const route = mutationMap[write.type as keyof typeof mutationMap];

    if (!route) {
      throw new Error(`Unknown mutation type: ${write.type}`);
    }


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


  private async checkBlockedParents(parentId: string): Promise<boolean> {
    const db = new AppCacheDB();
    const parent = await db.OfflineWrites.get(parentId);


    return parent?.syncStatus === "failed";
  }



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


  private isPermanentFailure(error: any): boolean {
    if (error instanceof HTTPError) {
      const statusCode = error.status;


      if (statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        return true;
      }


      if (statusCode >= 500) {
        // Consider 501, 502, 503 as temporary, others as permanent
        return ![501, 502, 503].includes(statusCode);
      }
    }

    return false;
  }



  private async cleanup(): Promise<void> {
    try {
      const db = new AppCacheDB();
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      let query = db.OfflineWrites.where("userId").equals(this.options.userId);


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



export async function syncOfflineRecords(
  userId: string,
  onProgress?: (syncedCount: number, totalCount: number) => void,
  onSyncStart?: (totalCount: number) => void,
  onSyncComplete?: () => void,
  facilityId?: string,
): Promise<SyncResult> {
  const syncManager = new SyncManager({
    userId,
    facilityId,
    maxRetries: 3,
    retryDelayMs: 1000,
    enableConflictDetection: true,
    onProgress,
    onSyncStart,
    onSyncComplete,
  });

  return syncManager.sync();
}

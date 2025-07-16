import { toast } from "sonner";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import { ApiRoute, HTTPError } from "@/Utils/request/types";
import patientApi from "@/types/emr/patient/patientApi";
import scheduleApis from "@/types/scheduling/scheduleApi";

import { AppCacheDB } from "./AppcacheDB";
import { OfflineKey } from "./offlineKeys";

export const mutationMap = {
  create_patient: patientApi.addPatient,
  update_patient: patientApi.updatePatient,
  create_encounter: routes.encounter.create,
  mark_encounter_as_complete: routes.encounter.update,
  create_resource_request: routes.createResource,
  update_resource_request: routes.updateResource,
  assign_user_to_patient: routes.patient.users.addUser,
  remove_user_from_patient: routes.patient.users.removeUser,
  create_appointment: scheduleApis.slots.createAppointment,
  reschedule_appointment: scheduleApis.appointments.reschedule,
  update_appointment_status: scheduleApis.appointments.update,
  cancel_appointment: scheduleApis.appointments.cancel,
  non_structured_questionnaire: routes.batchRequest,
  update_encounter_questionnair: routes.batchRequest,
  structured_questionnair: routes.batchRequest,
} satisfies Record<OfflineKey, ApiRoute<any, any>>;

export async function syncOfflineRecords() {
  const db = new AppCacheDB();
  const offlineRecords = await db.OfflineWrites.where("syncStatus")
    .equals("pending")
    .toArray();

  for (const record of offlineRecords) {
    const {
      id,
      mutationSyncRouteKey,
      payload,
      mutationPathParams,
      mutationQueryParams,
    } = record;

    const route = mutationMap[mutationSyncRouteKey];

    if (!route) {
      console.warn(`⚠️ Unknown mutationSyncRouteKey: ${mutationSyncRouteKey}`);
      continue;
    }

    try {
      // Prepare mutate function with route + options
      const runMutation = mutate(route, {
        pathParams: mutationPathParams,
        queryParams: mutationQueryParams,
      });

      // Call it with payload
      const typedPayload = payload as (typeof route)["TBody"];
      const response = await runMutation(typedPayload);

      // Update DB entry as synced
      await db.OfflineWrites.update(id, {
        syncStatus: "success",
        response,
      });

      toast.success(` Synced record ${mutationSyncRouteKey}`);
    } catch (error: any) {
      const serverError =
        error instanceof HTTPError
          ? JSON.stringify(error.cause || error.message)
          : error?.message || "Unknown error";

      await db.OfflineWrites.update(id, {
        syncStatus: "failed",
        lastError: serverError,
        lastAttemptAt: Date.now(),
        retries: (record.retries ?? 0) + 1,
      });

      toast.error(`Failed to sync record ${mutationSyncRouteKey}`);
      toast.error(` Failed to sync record ${mutationSyncRouteKey}`, error);
    }
  }

  toast.info(" sync complete");
}

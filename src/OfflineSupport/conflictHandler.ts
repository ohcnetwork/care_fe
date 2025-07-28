import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import patientApi from "@/types/emr/patient/patientApi";
import scheduleApis from "@/types/scheduling/scheduleApi";

import { OfflineWritesEntry } from "./AppcacheDB";
import { markWriteStatus } from "./writeQueue";

/**
 * queryMap: Used for conflict detection and fetching current server data.
 * Maps logical query keys to API functions/routes.
 */
export const queryMap = {
  getPatient: patientApi.getPatient,
  getEncounter: routes.encounter.get,
  getResourceDetails: routes.getResourceDetails,
  getAppointment: scheduleApis.appointments.retrieve,
};

/**
 * Detects conflict for an update write by fetching the current server record and comparing modified_date.
 * If a conflict is detected, marks the write as conflict and stores the server data.
 * Returns true if a conflict was detected, false otherwise.
 */
export async function detectAndMarkConflict(
  write: OfflineWritesEntry,
): Promise<boolean> {
  if (!write.useQueryRouteKey) {
    return false;
  }

  try {
    const fetchFn = queryMap[write.useQueryRouteKey as keyof typeof queryMap];
    if (!fetchFn) return false;

    // Use your query utility to fetch the server data
    const fetchData = query(fetchFn, {
      pathParams: write.useQueryPathParams,
      queryParams: write.useQueryParams,
    });
    const serverData = await fetchData({
      signal: new AbortController().signal,
    });

    if (serverData && serverData.modified_date !== write.serverTimestamp) {
      await markWriteStatus(write.id, "conflict", {
        conflictData: serverData,
        lastAttemptAt: Date.now(),
      });
      return true;
    }
  } catch (err) {
    console.warn(`detectAndMarkConflict: failed for write ${write.id}`, err);
  }
  return false;
}

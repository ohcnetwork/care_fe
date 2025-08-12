import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";
import scheduleApis from "@/types/scheduling/scheduleApi";

import { OfflineWritesEntry } from "./AppcacheDB";
import { markWriteStatus } from "./writeQueue";

// queryMap: Used for conflict detection and fetching current server data.
export const queryMap = {
  getPatient: patientApi.getPatient,
  getEncounter: encounterApi.get,
  getResourceDetails: routes.getResourceDetails,
  getAppointment: scheduleApis.appointments.retrieve,
} as const;


async function fetchDataForRoute(
  routeKey: keyof typeof queryMap,
  pathParams: Record<string, any>,
  queryParams?: Record<string, any>,
) {
  const fetchFn = queryMap[routeKey];
  if (!fetchFn) return null;

  const fetchData = query(fetchFn, {
    pathParams: pathParams as any,
    queryParams,
  });

  return await fetchData({
    signal: new AbortController().signal,
  });
}

export async function detectAndMarkConflict(
  write: OfflineWritesEntry,
): Promise<boolean> {
  if (!write.useQueryRouteKey) {
    return false;
  }

  try {
    const routeKey = write.useQueryRouteKey as keyof typeof queryMap;
    const serverData = await fetchDataForRoute(
      routeKey,
      write.useQueryPathParams || {},
      write.useQueryParams,
    );

    if (serverData && serverData.modified_date !== write.serverTimestamp) {
      await markWriteStatus(write.id, "conflict", {
        conflictData: serverData,
        lastError: "Data conflict detected - server data has been modified",
        lastErrorDetails: {
          serverModifiedDate: serverData.modified_date,
          clientTimestamp: write.serverTimestamp,
          conflictType: "data_modified",
        },
        lastAttemptAt: Date.now(),
      });
      return true;
    }
  } catch (err) {
    console.warn(`detectAndMarkConflict: failed for write ${write.id}`, err);
  }
  return false;
}

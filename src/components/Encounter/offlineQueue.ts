import { QueryClient } from "@tanstack/react-query";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import {
  OfflineKeyMap,
  PathParamsObject,
  QueryParamsObject,
} from "@/OfflineSupport/offlineKeys";
import {
  normalizeOfflineEncounterRecord,
  normalizeUserBase,
  saveOfflineWrite,
  saveOfflineWriteData,
  updateActiveEncounterList,
} from "@/OfflineSupport/offlineWriteHelpers";
import { PaginatedResponse } from "@/Utils/request/types";
import {
  EncounterCreate,
  EncounterEdit,
  EncounterRead,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { PatientRead } from "@/types/emr/patient/patient";
import { CurrentUserRead } from "@/types/user/user";

interface QueueNewEncounterOfflineParams {
  encounterRequestData: EncounterCreate;
  userId: string;
  facilityId: string;
  patientId: string;
  queryClient: QueryClient;
  authUser: CurrentUserRead;
  selectedTags: any[];
  offlineSelectedOrganizations: any[];
  appointmentId?: string;
  onSuccess?: (encounterId: string, normalizedEncounter: EncounterRead) => void;
  onError?: (error: Error) => void;
}

interface QueueMarkAsCompleteParams {
  encounter: EncounterRead;
  encounterUpdatedData: EncounterEdit;
  userId: string;
  queryClient: QueryClient;
  user: CurrentUserRead;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface NormalizeAndSetQueryDataParams {
  entry: any;
  patientData: PatientRead;
  queryClient: QueryClient;
  authUser: CurrentUserRead;
  selectedTags: any[];
  permissions: string[] | undefined;
  offlineSelectedOrganizations: any[];
  patientId: string;
  appointmentId?: string;
}

const normalizeAndSetQueryData = async ({
  entry,
  patientData,
  queryClient,
  authUser,
  selectedTags,
  permissions,
  offlineSelectedOrganizations,
  patientId,
  appointmentId,
}: NormalizeAndSetQueryDataParams): Promise<EncounterRead> => {
  const normalizeEncounter = normalizeOfflineEncounterRecord(
    queryClient,
    entry,
    patientData,
    authUser,
    selectedTags,
    permissions,
    offlineSelectedOrganizations || [],
  );

  const db = new AppCacheDB();
  await db.OfflineWrites.update(entry.id, {
    normalizedData: normalizeEncounter,
  });

  queryClient.setQueryData(
    ["encounter", normalizeEncounter.id],
    normalizeEncounter,
  );

  if (appointmentId) {
    const existingAppointment = queryClient.getQueryData<any>([
      "appointment",
      appointmentId,
    ]);

    if (existingAppointment) {
      queryClient.setQueryData(["appointment", appointmentId], {
        ...existingAppointment,
        associated_encounter: normalizeEncounter,
      });
    }
  }

  const encounterListKey = ["encounterHistory", patientId, {}];

  const prevEncounterList =
    queryClient.getQueryData<PaginatedResponse<EncounterRead>>(
      encounterListKey,
    );

  const updatedList: PaginatedResponse<EncounterRead> = prevEncounterList
    ? {
        ...prevEncounterList,
        count: prevEncounterList.count + 1,
        results: [normalizeEncounter, ...prevEncounterList.results],
      }
    : {
        count: 1,
        results: [normalizeEncounter],
      };

  queryClient.setQueryData(encounterListKey, updatedList);

  updateActiveEncounterList({
    queryClient: queryClient,
    action: "createEncounter",
    patientID: patientId,
    normalizeEncounter: normalizeEncounter,
  });

  return normalizeEncounter;
};

export const queueMarkAscompleteRecord = async ({
  encounter,
  encounterUpdatedData,
  userId,
  queryClient,
  user,
  onSuccess,
  onError,
}: QueueMarkAsCompleteParams): Promise<void> => {
  try {
    // Check if this is an offline-created encounter
    if (encounter.id.startsWith("offline-")) {
      const error = new Error(
        "Cannot mark offline-created encounter as complete",
      );
      onError?.(error);
      return;
    }

    const useQueryParams: QueryParamsObject<typeof encounterApi.get> = encounter
      .facility.id
      ? { facility: encounter.facility.id }
      : { patient: encounter.patient.id };

    const offlineWrite: saveOfflineWriteData = {
      id: encounter.id,
      userId: userId,
      facilityId: encounter.facility.id,
      mutationSyncRouteKey: OfflineKeyMap.mark_encounter_as_complete,
      type: OfflineKeyMap.mark_encounter_as_complete,
      resourceType: "Encounter",
      mutationPathParams: { id: encounter.id } satisfies PathParamsObject<
        typeof encounterApi.update
      >,
      payload: encounterUpdatedData,
      serverTimestamp: encounter.modified_date,
      useQueryRouteKey: "getEncounter",
      useQueryPathParams: { id: encounter.id } satisfies PathParamsObject<
        typeof encounterApi.get
      >,
      useQueryParams: useQueryParams,
    };

    const saveResult = await saveOfflineWrite(offlineWrite);
    if (!saveResult.success) {
      const error = new Error(saveResult.error);
      onError?.(error);
      return;
    }

    const updatedEncounter: EncounterRead = {
      ...encounter,
      status: "completed",
      updated_by: {
        ...normalizeUserBase(user),
        last_login: user.last_login ?? "",
        profile_picture_url: user.profile_picture_url ?? "",
        deleted: false,
        mfa_enabled: false,
      },
      is_updated_offline: true,
    };

    const db = new AppCacheDB();
    // Update the offline write entry with normalized data for display/editing
    await db.OfflineWrites.update(saveResult.entry.id, {
      normalizedData: updatedEncounter,
    });

    updateActiveEncounterList({
      queryClient,
      action: "markAsCompleteEncounter",
      patientID: encounter.patient.id,
      normalizeEncounter: updatedEncounter,
    });

    queryClient.setQueryData(["encounter", encounter.id], updatedEncounter);

    onSuccess?.();
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error("Unknown error occurred");
    onError?.(errorObj);
  }
};

export const queueNewEncounterOffline = async ({
  encounterRequestData,
  userId,
  facilityId,
  patientId,
  queryClient,
  authUser,
  selectedTags,
  offlineSelectedOrganizations,
  appointmentId,
  onSuccess,
  onError,
}: QueueNewEncounterOfflineParams): Promise<string | null> => {
  try {
    const generatedId = `offline-${crypto.randomUUID()}`;

    const offlineWrite: saveOfflineWriteData = {
      id: generatedId,
      userId: userId,
      facilityId: facilityId,
      mutationSyncRouteKey: OfflineKeyMap.create_encounter,
      type: OfflineKeyMap.create_encounter,
      resourceType: "Encounter",
      payload: encounterRequestData,
      parentMutationId: appointmentId?.startsWith("offline-")
        ? appointmentId
        : patientId.startsWith("offline-")
          ? patientId
          : undefined,
    };

    const saveResult = await saveOfflineWrite(offlineWrite);
    if (!saveResult.success) {
      const error = new Error(saveResult.error);
      onError?.(error);
      return null;
    }

    const patientData = queryClient.getQueryData<PatientRead>([
      "patient",
      patientId,
    ]);
    if (!patientData) {
      const error = new Error("Patient cache missing");
      onError?.(error);
      return null;
    }

    const permissions = queryClient.getQueryData<string[]>([
      "encounterPermissions",
      facilityId,
    ]);

    const normalizeEncounter = await normalizeAndSetQueryData({
      entry: saveResult.entry,
      patientData,
      queryClient,
      authUser,
      selectedTags,
      permissions,
      offlineSelectedOrganizations,
      patientId,
      appointmentId,
    });

    // Call success callback with the generated ID and normalized encounter
    onSuccess?.(generatedId, normalizeEncounter);

    return generatedId;
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error("Unknown error occurred");
    onError?.(errorObj);
    return null;
  }
};

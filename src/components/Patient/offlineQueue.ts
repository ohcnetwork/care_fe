import { QueryClient } from "@tanstack/react-query";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { OfflineKeyMap, PathParamsObject } from "@/OfflineSupport/offlineKeys";
import {
  normalizeOfflinePatientRecord,
  pickPatientCreateFields,
  saveOfflineWrite,
  saveOfflineWriteData,
} from "@/OfflineSupport/offlineWriteHelpers";
import {
  PatientCreate,
  PatientRead,
  PatientUpdate,
} from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { Organization } from "@/types/organization/organization";
import { PatientIdentifier } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import { CurrentUserRead } from "@/types/user/user";

interface QueueNewPatientOfflineParams {
  createPatientData: PatientCreate;
  identifiers: PatientIdentifier[];
  userId: string;
  facilityId: string;
  queryClient: QueryClient;
  authUser: CurrentUserRead;
  selectedOrganization: Organization | null;
  selectedTags: TagConfig[];
  onSuccess?: (patientId: string, normalizedPatient: PatientRead) => void;
  onError?: (error: Error) => void;
}

interface QueuePatientUpdateOfflineParams {
  updatePatientData: PatientUpdate;
  identifiers: PatientIdentifier[];
  patientId: string;
  userId: string;
  facilityId: string;
  queryClient: QueryClient;
  authUser: CurrentUserRead;
  selectedOrganization: Organization | null;
  existingTags: TagConfig[];
  permissions: string[] | undefined;
  createdDate?: string;
  modifiedDate?: string;
  onSuccess?: (patientId: string, normalizedPatient: PatientRead) => void;
  onError?: (error: Error) => void;
}

interface NormalizeAndSetQueryDataParams {
  entry: any;
  patientData: PatientRead | undefined;
  queryClient: QueryClient;
  authUser: CurrentUserRead;
  selectedOrganization: Organization | null;
  existingTags: TagConfig[];
  identifiers: PatientIdentifier[];
  permissions: string[] | undefined;
  createdDate?: string;
  modifiedDate?: string;
}

const normalizeAndSetQueryData = async ({
  entry,
  patientData: _patientData,
  queryClient,
  authUser,
  selectedOrganization,
  existingTags,
  identifiers,
  permissions,
  createdDate,
  modifiedDate,
}: NormalizeAndSetQueryDataParams): Promise<PatientRead> => {
  const normalizePatient = normalizeOfflinePatientRecord(
    entry,
    authUser,
    selectedOrganization,
    existingTags,
    identifiers,
    permissions,
    createdDate,
    modifiedDate,
  );

  const db = new AppCacheDB();
  await db.OfflineWrites.update(entry.id, {
    normalizedData: normalizePatient,
  });

  queryClient.setQueryData(["patient", normalizePatient.id], normalizePatient);

  const { phone_number, year_of_birth } = normalizePatient;
  const partial_id = normalizePatient.id.startsWith("offline-")
    ? `offline-${normalizePatient.id.slice(8, 13)}`
    : normalizePatient.id.slice(0, 5);

  const yearOfBirthStr = String(year_of_birth);

  queryClient.setQueryData(
    ["patient-verify", phone_number, yearOfBirthStr, partial_id],
    normalizePatient,
  );

  return normalizePatient;
};

export const queueNewPatientOffline = async ({
  createPatientData,
  identifiers,
  userId,
  facilityId,
  queryClient,
  authUser,
  selectedOrganization,
  selectedTags,
  onSuccess,
  onError,
}: QueueNewPatientOfflineParams): Promise<string | null> => {
  try {
    const generatedId = `offline-${crypto.randomUUID()}`;

    const offlineWrite: saveOfflineWriteData = {
      id: generatedId,
      userId: userId,
      facilityId: facilityId,
      mutationSyncRouteKey: OfflineKeyMap.create_patient,
      type: OfflineKeyMap.create_patient,
      resourceType: "patient",
      payload: createPatientData,
    };

    const saveResult = await saveOfflineWrite(offlineWrite);
    if (!saveResult.success) {
      const error = new Error(saveResult.error);
      onError?.(error);
      return null;
    }

    const permissions = queryClient.getQueryData<string[]>([
      "patientPermissions",
      facilityId,
    ]);

    const normalizePatient = await normalizeAndSetQueryData({
      entry: saveResult.entry,
      patientData: undefined,
      queryClient,
      authUser,
      selectedOrganization,
      existingTags: selectedTags,
      identifiers,
      permissions,
    });

    // Call success callback with the generated ID and normalized patient
    onSuccess?.(generatedId, normalizePatient);

    return generatedId;
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error("Unknown error occurred");
    onError?.(errorObj);
    return null;
  }
};

export const queuePatientUpdateOffline = async ({
  updatePatientData,
  identifiers,
  patientId,
  userId,
  facilityId,
  queryClient,
  authUser,
  selectedOrganization,
  existingTags,
  permissions,
  createdDate,
  modifiedDate,
  onSuccess,
  onError,
}: QueuePatientUpdateOfflineParams): Promise<void> => {
  try {
    const db = new AppCacheDB();
    const entry = await db.OfflineWrites.get(patientId);

    if (entry) {
      const isCreateType = entry.type === OfflineKeyMap.create_patient;
      const updatedEntry = isCreateType
        ? {
            ...entry,
            payload: pickPatientCreateFields({
              ...(entry.payload as PatientCreate),
              ...updatePatientData,
            }),
            syncStatus: "pending" as const,
          }
        : {
            ...entry,
            payload: {
              ...(entry.payload as PatientUpdate),
              ...updatePatientData,
            },
            syncStatus: "pending" as const,
          };

      await db.OfflineWrites.update(patientId, updatedEntry);

      const normalizePatient = await normalizeAndSetQueryData({
        entry: updatedEntry,
        patientData: undefined,
        queryClient,
        authUser,
        selectedOrganization,
        existingTags,
        identifiers,
        permissions,
        createdDate,
        modifiedDate,
      });

      // Call success callback with the patient ID and normalized patient
      onSuccess?.(patientId, normalizePatient);
    } else {
      const offlineWrite: saveOfflineWriteData = {
        id: patientId,
        userId: userId,
        facilityId: facilityId,
        mutationSyncRouteKey: OfflineKeyMap.update_patient,
        type: OfflineKeyMap.update_patient,
        resourceType: "patient",
        mutationPathParams: {
          id: patientId || "",
        } satisfies PathParamsObject<typeof patientApi.updatePatient>,
        payload: updatePatientData,
        serverTimestamp: modifiedDate,
        useQueryRouteKey: "getPatient",
        useQueryPathParams: { id: patientId || "" },
      };

      const saveResult = await saveOfflineWrite(offlineWrite);
      if (!saveResult.success) {
        const error = new Error(saveResult.error);
        onError?.(error);
        return;
      }

      const normalizePatient = await normalizeAndSetQueryData({
        entry: saveResult.entry,
        patientData: undefined,
        queryClient,
        authUser,
        selectedOrganization,
        existingTags,
        identifiers,
        permissions,
        createdDate,
        modifiedDate,
      });

      // Call success callback with the patient ID and normalized patient
      onSuccess?.(patientId, normalizePatient);
    }
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error("Unknown error occurred");
    onError?.(errorObj);
  }
};

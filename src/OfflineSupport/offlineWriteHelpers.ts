import { QueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

import { Encounter } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/patient";
import { Organization } from "@/types/organization/organization";

import { OfflineWritesEntry } from "./AppcacheDB";
import { AppCacheDB } from "./AppcacheDB";

export type SaveOfflineWriteResult =
  | { success: true; entry: OfflineWritesEntry }
  | { success: false; error: string };

export type saveOfflineWriteData = {
  id: string;
  userId: string;
  syncrouteKey: string;
  type?: string;
  resourceType?: string;
  pathParams?: Record<string, any>;
  payload: unknown;
  parentMutationIds?: string[];
  dependentFields?: Array<{
    parentId: string;
    childField: string;
    parentField: string;
  }>;
  serverTimestamp?: string;
  queryrouteKey?: string;
  queryParams?: Record<string, any>;
};
const db = new AppCacheDB();
export const saveOfflineWrite = async ({
  id,
  userId,
  syncrouteKey,
  type,
  resourceType,
  pathParams,
  payload,
  parentMutationIds,
  dependentFields,
  serverTimestamp,
  queryrouteKey,
  queryParams,
}: saveOfflineWriteData): Promise<SaveOfflineWriteResult> => {
  const writeEntry = {
    id,
    userId,
    syncrouteKey,
    type,
    resourceType,
    pathParams,
    payload,
    parentMutationIds,
    dependentFields,
    clientTimestamp: Date.now(),
    serverTimestamp,
    syncStatus: "pending" as const,
    retries: 0,
    queryrouteKey,
    queryParams,
  };
  try {
    await db.OfflineWrites.add(writeEntry);
    return { success: true, entry: writeEntry };
  } catch (error) {
    console.error("Failed to save offline write:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, error: errorMessage };
  }
};
export const isOfflineId = (id: string) => id.startsWith("offline-");
export const getYearOfBirth = (
  date_of_birth?: string,
  age?: number,
): number | undefined => {
  const currentYear = dayjs().year();

  if (date_of_birth) {
    const parsed = dayjs(date_of_birth);
    if (parsed.isValid()) {
      return parsed.year();
    }
  }

  if (typeof age === "number") {
    return currentYear - age;
  }

  return undefined;
};

export const normalizeOfflinePatientRecord = (
  record: any,
  queryClient: QueryClient,
): Patient => {
  const payload = record?.payload ?? {};
  const nowIso = new Date(record.clientTimestamp).toISOString();

  const orgId = payload.geo_organization;
  const selectedOrg =
    orgId &&
    queryClient.getQueryData<Organization>(["selectedGeoLocation", orgId]);

  const yob = getYearOfBirth(payload.date_of_birth, payload.age);

  return {
    id: record.id,
    name: payload.name ?? "-",
    gender: payload.gender ?? "unknown",
    phone_number: payload.phone_number ?? "",
    emergency_phone_number: payload.emergency_phone_number ?? "",
    address: payload.address ?? "",
    permanent_address: payload.permanent_address ?? "",
    pincode: payload.pincode ?? null,
    blood_group: payload.blood_group ?? null,
    date_of_birth: payload.date_of_birth ?? null,
    year_of_birth: yob ?? 0,
    deceased_datetime: payload.deceased_datetime,

    created_date: nowIso,
    modified_date: nowIso,

    geo_organization: selectedOrg ?? {
      id: orgId ?? "unknown",
      name: "-",
      org_type: "-",
      metadata: { country: "India" },
      parent: {},
      active: true,
      description: null,
      level_cache: 0,
      system_generated: false,
      has_children: false,
    },

    created_by: null,

    updated_by: null,

    permissions: [],
  };
};

export const normalizeOfflineEncounterRecord = (
  entry: any,
  patientData: Patient,
): Encounter => {
  const payload = entry.payload as any;
  console.log("patientdata", patientData);
  return {
    id: entry.id,
    patient: patientData,
    facility: {
      id: payload.facility,
      name: "Offline Facility",
    },
    status: payload.status ?? "Unknown (offline)",
    encounter_class: payload.encounter_class ?? "Unknown (offline)",
    period: {
      start:
        payload.period?.start ??
        payload.start_date ??
        new Date(entry.clientTimestamp).toISOString(),
    },
    priority: payload.priority ?? "Unknown (offline)",
    created_by: payload.created_by ?? null,
    updated_by: payload.updated_by ?? null,
    created_date: new Date(entry.clientTimestamp).toISOString(),
    modified_date: new Date(entry.clientTimestamp).toISOString(),
    encounter_class_history: {
      history: [],
    },
    status_history: {
      history: [],
    },
    organizations: payload.organizations ?? [],
    current_location: payload.current_location ?? null,
    location_history: payload.location_history ?? [],
    permissions: payload.permissions ?? [],
    care_team: payload.care_team ?? [],
  };
};

import { QueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";

import { FacilityModel } from "@/components/Facility/models";
import { AuthUserModel } from "@/components/Users/models";

import { Encounter } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/patient";
import { FacilityData } from "@/types/facility/facility";
import { Organization } from "@/types/organization/organization";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";
import { UserBase } from "@/types/user/user";

import { OfflineWritesEntry } from "./AppcacheDB";
import { AppCacheDB } from "./AppcacheDB";

export type SaveOfflineWriteResult =
  | { success: true; entry: OfflineWritesEntry }
  | { success: false; error: string };

export type saveOfflineWriteData = {
  id: string;
  userId: string;
  mutationSyncrouteKey: string;
  mutationPathParams?: Record<string, any>;
  mutationQueryParams?: Record<string, any>;
  type?: string;
  resourceType?: string;
  payload: unknown;
  parentMutationIds?: string[];
  dependentFields?: Array<{
    parentId: string;
    childField: string;
    parentField: string;
  }>;
  serverTimestamp?: string;
  useQueryrouteKey?: string;
  useQueryPathParams?: Record<string, any>;
  useQueryParams?: Record<string, any>;
};
const db = new AppCacheDB();
export const saveOfflineWrite = async ({
  id,
  userId,
  mutationSyncrouteKey,
  type,
  resourceType,
  mutationPathParams,
  mutationQueryParams,
  payload,
  parentMutationIds,
  dependentFields,
  serverTimestamp,
  useQueryrouteKey,
  useQueryPathParams,
  useQueryParams,
}: saveOfflineWriteData): Promise<SaveOfflineWriteResult> => {
  const writeEntry = {
    id,
    userId,
    mutationSyncrouteKey,
    type,
    resourceType,
    mutationPathParams,
    mutationQueryParams,
    payload,
    parentMutationIds,
    dependentFields,
    clientTimestamp: Date.now(),
    serverTimestamp,
    syncStatus: "pending" as const,
    retries: 0,
    useQueryrouteKey,
    useQueryPathParams,
    useQueryParams,
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
  entry: any,
  user: AuthUserModel,
  selectedGeoLocation: Organization | null,
  permissions?: string[],
): Patient => {
  const payload = entry?.payload ?? {};
  const nowIso = new Date(entry.clientTimestamp).toISOString();

  const yob = getYearOfBirth(payload.date_of_birth, payload.age);

  return {
    id: entry.id,
    name: payload.name ?? "-",
    gender: payload.gender ?? "male",
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

    geo_organization: selectedGeoLocation ?? {
      id: payload.geo_organization ?? "unknown",
      name: "-",
      org_type: "other",
      level_cache: 0,
      has_children: false,
      active: true,
      metadata: null,
      permissions: [],
      created_at: "-",
      updated_at: "-",
    },

    created_by: {
      id: user.id,
      first_name: user.first_name,
      username: user.username,
      email: user.email,
      last_name: user.last_name,
      user_type: user.user_type,
      last_login: user.last_login ?? "",
      read_profile_picture_url: user.read_profile_picture_url ?? "",
      external_id: user.external_id,
      suffix: user.suffix,
      prefix: user.prefix,
    },

    updated_by: {
      id: user.id,
      first_name: user.first_name,
      username: user.username,
      email: user.email,
      last_name: user.last_name,
      user_type: user.user_type,
      last_login: user.last_login ?? "",
      read_profile_picture_url: user.read_profile_picture_url ?? "",
      external_id: user.external_id,
      suffix: user.suffix,
      prefix: user.prefix,
    },

    permissions: permissions ?? [],
  };
};

export const normalizeOfflineEncounterRecord = (
  entry: any,
  patientData: Patient,
): Encounter => {
  const payload = entry.payload as any;

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

export const normaliZedResourcerequestRecord = (
  entry: any,
  patientData: Patient | undefined,
  assigned_facility: FacilityModel | undefined,
  assignToUser: UserBase | undefined,
  queryClient: QueryClient,
  user: AuthUserModel,
): ResourceRequest => {
  const payload = entry.payload as any;
  console.log("datetime", entry.clientTimestamp);
  const nowIso = new Date(entry.clientTimestamp).toISOString();
  const originFacilityId = payload.origin_facility;
  const originfacility =
    originFacilityId &&
    queryClient.getQueryData<FacilityData>(["facility", originFacilityId]);

  // const assignFacilityid = payload.assigned_facility;
  // const assignedFacility =
  //   assignFacilityid &&
  //   queryClient.getQueryData<FacilityModel>([
  //     "assigned_facility",
  //     assignFacilityid,
  //   ]);

  // const assignUserId = payload.assigned_to;
  // const assignedUser =
  //   assignUserId &&
  //   queryClient.getQueryData<UserBase>(["assignToUser", assignUserId]);
  return {
    approving_facility: payload.approving_facility ?? null,
    assigned_facility: assigned_facility ?? undefined,
    category: payload.category ?? "-",
    emergency: payload.emergency ?? null,
    id: entry?.id,
    origin_facility: originfacility,
    priority: payload.priority ?? null,
    reason: payload.reason ?? null,
    referring_facility_contact_name:
      payload.referring_facility_contact_name ?? "unknown(offline)",
    referring_facility_contact_number:
      payload.referring_facility_contact_number ?? "unknown(offline)",
    requested_quantity: payload.requested_quantity ?? null,
    status: payload.status ?? "unknown(offline)",
    title: payload.title ?? "unknown(offline)",
    assigned_to: assignToUser ?? null,
    created_by: {
      id: user.external_id,
      first_name: user.first_name,
      username: user.username,
      email: user.email,
      last_name: user.last_name,
      user_type: user.user_type,
      last_login: user.last_login ?? "",
      profile_picture_url: user.read_profile_picture_url ?? "",
      phone_number: user.phone_number ?? "unknown(offline)",
      gender: user.gender ?? "male",
      suffix: user.suffix,
      prefix: user.prefix,
      mfa_enabled: user.mfa_enabled ?? false,
      deleted: user.deleted ?? false,
    },
    updated_by: {
      id: user.external_id,
      first_name: user.first_name,
      username: user.username,
      email: user.email,
      last_name: user.last_name,
      user_type: user.user_type,
      last_login: user.last_login ?? "",
      profile_picture_url: user.read_profile_picture_url ?? "",
      phone_number: user.phone_number ?? "unknown(offline)",
      gender: user.gender ?? "male",
      suffix: user.suffix,
      prefix: user.prefix,
      mfa_enabled: user.mfa_enabled ?? false,
      deleted: user.deleted ?? false,
    },
    created_date: nowIso,
    modified_date: nowIso,
    related_patient: patientData ?? null,
  };
};

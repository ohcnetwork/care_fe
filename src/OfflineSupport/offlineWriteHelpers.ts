import { QueryClient } from "@tanstack/react-query";
import { max, startOfToday } from "date-fns";
import dayjs from "dayjs";

import { FacilityModel } from "@/components/Facility/models";
import { AuthUserModel } from "@/components/Users/models";

import { PaginatedResponse } from "@/Utils/request/types";
import { dateQueryString, getMonthStartAndEnd } from "@/Utils/utils";
import { Encounter, EncounterEditRequest } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/patient";
import { FacilityBareMinimum, FacilityData } from "@/types/facility/facility";
import { Organization } from "@/types/organization/organization";
import { ResourceRequest } from "@/types/resourceRequest/resourceRequest";
import {
  Appointment,
  AppointmentNonCancelledStatus,
  AvailabilityHeatmapResponse,
  TokenSlot,
} from "@/types/scheduling/schedule";
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
  entry: OfflineWritesEntry,
  user: AuthUserModel,
  selectedGeoLocation: Organization | null,
  permissions?: string[],
  created_date?: string,
  modified_date?: string,
): Patient => {
  const payload = entry?.payload as any;
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
    pincode: payload.pincode ?? undefined,
    blood_group: payload.blood_group ?? null,
    date_of_birth: payload.date_of_birth ?? null,
    year_of_birth: yob ?? 0,
    deceased_datetime: payload.deceased_datetime,

    created_date: created_date ? created_date : nowIso,
    modified_date: modified_date ? modified_date : nowIso,

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
    is_updated_offline: true,
  };
};

export const normalizeOfflineEncounterRecord = (
  queryClient: QueryClient,
  entry: OfflineWritesEntry,
  patientData: Patient,
  authUser: AuthUserModel,
  permissions?: string[],
  created_by?: UserBase,
  created_date?: string,
  modified_date?: string,
): Encounter => {
  const payload = entry.payload as EncounterEditRequest;

  const facilityData = queryClient.getQueryData<FacilityData>([
    "facility",
    payload.facility,
  ]);
  return {
    id: entry.id,
    patient: patientData,
    facility: {
      id: facilityData?.id ?? payload.facility,
      name: facilityData?.name ?? "Unknown(offline)",
    },
    status: payload.status ?? "Unknown (offline)",
    encounter_class: payload.encounter_class ?? "Unknown (offline)",
    period: {
      start:
        payload.period?.start ?? new Date(entry.clientTimestamp).toISOString(),
    },
    hospitalization: payload?.hospitalization,
    priority: payload.priority ?? "Unknown (offline)",
    external_identifier: payload?.external_identifier,
    created_by: created_by ? created_by : normalizeUserBase(authUser),
    updated_by: normalizeUserBase(authUser),
    created_date: created_date
      ? created_date
      : new Date(entry.clientTimestamp).toISOString(),
    modified_date: modified_date
      ? modified_date
      : new Date(entry.clientTimestamp).toISOString(),
    encounter_class_history: {
      history: [],
    },
    status_history: {
      history: [],
    },
    organizations: [],
    current_location: null,
    location_history: [],
    permissions: permissions ?? [],
    care_team: [],
    discharge_summary_advice: payload?.discharge_summary_advice ?? undefined,
    is_updated_offline: true,
  };
};

export const normaliZedResourcerequestRecord = (
  entry: OfflineWritesEntry,
  patientData: Patient | undefined,
  assigned_facility: FacilityModel | undefined,
  assignToUser: UserBase | undefined,
  queryClient: QueryClient,
  user: AuthUserModel,
  created_date?: string,
  modified_date?: string,
): ResourceRequest => {
  const payload = entry.payload as any;

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
    created_by: normalizeUserBase(user),
    updated_by: normalizeUserBase(user),
    created_date: created_date ? created_date : nowIso,
    modified_date: modified_date ? modified_date : nowIso,
    related_patient: patientData ?? null,
    is_updated_offline: true,
  };
};

export const normalizedAppointmentRecord = (
  entry: OfflineWritesEntry,
  selectedTokenSlot: TokenSlot,
  patientData: Patient,
  bookedBy: AuthUserModel | null,
  status: AppointmentNonCancelledStatus,
  practitioner: UserBase,
  facility: FacilityBareMinimum,
): Appointment => {
  const payload = entry.payload as any;
  const nowIso = new Date(entry.clientTimestamp).toISOString();
  return {
    id: entry.id,
    token_slot: selectedTokenSlot,
    patient: patientData ?? null,
    booked_on: nowIso,
    booked_by: bookedBy ? normalizeUserBase(bookedBy) : null,
    status: status,
    reason_for_visit: payload?.reason_for_visit,
    user: practitioner,
    facility: facility,
    is_updated_offline: true,
    modified_date: nowIso,
  };
};

export const updateSlotCacheAfterOfflineAppointment = ({
  queryClient,
  selectedSlot,
  selectedPracticioner,
  facilityId,
  action,
  selectedDate,
  selectedMonth,
  previousSlot,
  previousDate,
  previousMonth,
}: {
  queryClient: QueryClient;
  selectedSlot?: TokenSlot;
  selectedPracticioner: UserBase;
  facilityId: string;
  action: "booked" | "rescheduled" | "cancel" | "mark_as_entered_in_error";
  selectedDate?: Date;
  selectedMonth?: Date;
  previousSlot?: TokenSlot;
  previousDate?: Date;
  previousMonth?: Date;
}) => {
  const getKeys = (date: Date, month: Date) => {
    const { start, end } = getMonthStartAndEnd(month);
    const fromDate = dateQueryString(max([start, startOfToday()]));
    const toDate = dateQueryString(max([fromDate, end]));
    return {
      availabilityHeatmapKey: [
        "availabilityHeatmap",
        selectedPracticioner.id,
        fromDate,
        toDate,
      ],
      slotQueryKey: [
        "slots",
        facilityId,
        selectedPracticioner.id,
        dateQueryString(date),
      ],
      dateKey: dateQueryString(date),
    };
  };

  // Utility to update heatmap slot counts
  const updateHeatmap = (key: any[], dateKey: string, delta: number) => {
    const heatmap = queryClient.getQueryData<AvailabilityHeatmapResponse>(key);
    if (heatmap && heatmap[dateKey]) {
      const prev = heatmap[dateKey];
      const updated: AvailabilityHeatmapResponse = {
        ...heatmap,
        [dateKey]: {
          ...prev,
          booked_slots: Math.max((prev.booked_slots ?? 0) + delta, 0),
        },
      };
      queryClient.setQueryData(key, updated);
    }
  };

  // Utility to update slot allocation
  const updateSlots = (key: any[], slotId: string, delta: number) => {
    const slotList = queryClient.getQueryData<{ results: TokenSlot[] }>(key);
    if (slotList) {
      const updatedSlots = {
        ...slotList,
        results: slotList.results.map((slot) =>
          slot.id === slotId
            ? {
                ...slot,
                allocated: Math.max((slot.allocated ?? 0) + delta, 0),
              }
            : slot,
        ),
      };
      queryClient.setQueryData(key, updatedSlots);
    }
  };

  // Handle increment for "booked" and "rescheduled"
  if (
    (action === "booked" || action === "rescheduled") &&
    selectedDate &&
    selectedMonth &&
    selectedSlot
  ) {
    const { availabilityHeatmapKey, slotQueryKey, dateKey } = getKeys(
      selectedDate,
      selectedMonth,
    );
    updateHeatmap(availabilityHeatmapKey, dateKey, +1);
    updateSlots(slotQueryKey, selectedSlot.id, +1);
  }

  // Handle decrement for "rescheduled", "cancel", and "mark_as_entered_in_error"
  if (
    (action === "rescheduled" ||
      action === "cancel" ||
      action === "mark_as_entered_in_error") &&
    previousSlot &&
    previousDate &&
    previousMonth
  ) {
    const {
      availabilityHeatmapKey: prevHeatmapKey,
      slotQueryKey: prevSlotKey,
      dateKey: prevDateKey,
    } = getKeys(previousDate, previousMonth);
    updateHeatmap(prevHeatmapKey, prevDateKey, -1);
    updateSlots(prevSlotKey, previousSlot.id, -1);
  }
};

export function normalizeUserBase(authUser: AuthUserModel): UserBase {
  return {
    id: authUser?.external_id,
    first_name: authUser?.first_name,
    username: authUser?.username,
    email: authUser?.email,
    last_name: authUser?.last_name,
    user_type: authUser?.user_type,
    last_login: authUser?.last_login ?? "",
    profile_picture_url: authUser?.read_profile_picture_url ?? "",
    phone_number: authUser?.phone_number ?? "unknown(offline)",
    gender: authUser?.gender ?? "male",
    suffix: authUser?.suffix,
    prefix: authUser?.prefix,
    mfa_enabled: authUser?.mfa_enabled ?? false,
    deleted: authUser?.deleted ?? false,
  };
}

export const updateActiveAndClosedEncounterList = ({
  queryClient,
  action,
  patientID,
  normalizeEncounter,
}: {
  queryClient: QueryClient;
  action: string;
  patientID: string;
  normalizeEncounter: Encounter;
}) => {
  const addEncounterToList = (
    EncouterList: PaginatedResponse<Encounter> | undefined,
    newEncounter: Encounter,
  ): PaginatedResponse<Encounter> => {
    const updatedList: PaginatedResponse<Encounter> = EncouterList?.results
      ? {
          ...EncouterList,
          results: [...EncouterList.results, newEncounter as Encounter],
          count: (EncouterList.count ?? EncouterList.results.length) + 1,
        }
      : {
          count: 1,
          results: [newEncounter as Encounter],
        };
    return updatedList;
  };

  if (action == "createEncounter" && normalizeEncounter) {
    const ActiveEncouterList = queryClient.getQueryData<
      PaginatedResponse<Encounter>
    >(["encounters", "live", patientID]);

    const newList = addEncounterToList(ActiveEncouterList, normalizeEncounter);

    queryClient.setQueryData(["encounters", "live", patientID], newList);
  } else if (action === "markAsCompleteEncounter" && normalizeEncounter) {
    const ActiveEncouterList = queryClient.getQueryData<
      PaginatedResponse<Encounter>
    >(["encounters", "live", patientID]);

    const UpdatedActiveEncounterList: PaginatedResponse<Encounter> =
      ActiveEncouterList?.results
        ? {
            ...ActiveEncouterList,
            results: ActiveEncouterList.results.filter(
              (entry) => entry.id !== normalizeEncounter?.id,
            ),
            count:
              (ActiveEncouterList.count ?? ActiveEncouterList.results.length) -
              1,
          }
        : {
            count: 0,
            results: [],
          };
    queryClient.setQueryData(
      ["encounters", "live", patientID],
      UpdatedActiveEncounterList,
    );

    const closedEncoutnerList = queryClient.getQueryData<
      PaginatedResponse<Encounter>
    >(["encounters", "closed", patientID]);

    const newList = addEncounterToList(closedEncoutnerList, normalizeEncounter);

    queryClient.setQueryData(["encounters", "closed", patientID], newList);
  }
};

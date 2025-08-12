import { QueryClient } from "@tanstack/react-query";
import { max, startOfToday } from "date-fns";
import dayjs from "dayjs";

import { FacilityModel } from "@/components/Facility/models";
import { AuthUserModel } from "@/components/Users/models";

import { PaginatedResponse } from "@/Utils/request/types";
import { dateQueryString, getMonthStartAndEnd } from "@/Utils/utils";
import { BatchRequestBody } from "@/types/base/batch/batch";
import { AllergyIntolerance } from "@/types/emr/allergyIntolerance/allergyIntolerance";
import { Diagnosis } from "@/types/emr/diagnosis/diagnosis";
import {
  EncounterCreate,
  EncounterRead,
} from "@/types/emr/encounter/encounter";
import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";
import { MedicationStatementRead } from "@/types/emr/medicationStatement";
import {
  PatientCreate,
  PatientRead,
  PatientUpdate,
} from "@/types/emr/patient/patient";
import { Symptom } from "@/types/emr/symptom/symptom";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { FacilityBareMinimum, FacilityData } from "@/types/facility/facility";
import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";
import { Organization } from "@/types/organization/organization";
import { PatientIdentifier } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import type { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";
import {
  CreateResourceRequest,
  ResourceRequest,
  UpdateResourceRequest,
} from "@/types/resourceRequest/resourceRequest";
import {
  AppointmentCreateRequest,
  AppointmentNonCancelledStatus,
  AppointmentRead,
  AvailabilityHeatmapResponse,
  TokenSlot,
} from "@/types/scheduling/schedule";
import { UserBase } from "@/types/user/user";

import { OfflineWritesEntry } from "./AppcacheDB";
import { AppCacheDB } from "./AppcacheDB";
import { OfflineKey } from "./offlineKeys";
import { markWriteStatus, processDependentWrites } from "./writeQueue";

interface QuestionnaireListResponse {
  results: QuestionnaireDetail[];
  count: number;
}
type BatchRequestItem = BatchRequestBody["requests"][number];
export type SaveOfflineWriteResult =
  | { success: true; entry: OfflineWritesEntry }
  | { success: false; error: string };

export type saveOfflineWriteData = {
  id: string;
  userId: string;
  facilityId?: string;
  mutationSyncRouteKey: OfflineKey;
  mutationPathParams?: Record<string, any>;
  mutationQueryParams?: Record<string, any>;
  type: OfflineKey;
  resourceType?: string;
  payload: unknown;
  normalizedData?: unknown;
  parentMutationId?: string;
  serverTimestamp?: string;
  useQueryRouteKey?: string;
  useQueryPathParams?: Record<string, any>;
  useQueryParams?: Record<string, any>;
};
const db = new AppCacheDB();
export const saveOfflineWrite = async ({
  id,
  userId,
  facilityId,
  mutationSyncRouteKey,
  type,
  resourceType,
  mutationPathParams,
  mutationQueryParams,
  payload,
  normalizedData,
  parentMutationId,
  serverTimestamp,
  useQueryRouteKey,
  useQueryPathParams,
  useQueryParams,
}: saveOfflineWriteData): Promise<SaveOfflineWriteResult> => {
  const writeEntry: OfflineWritesEntry = {
    id,
    userId,
    facilityId,
    mutationSyncRouteKey,
    type,
    resourceType,
    mutationPathParams,
    mutationQueryParams,
    payload,
    normalizedData,
    parentMutationId,

    clientTimestamp: Date.now(),
    serverTimestamp,
    syncStatus: "pending" as const,
    retries: 0,
    useQueryRouteKey,
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

// Its use when updating newly created unsynced patient
export const pickPatientCreateFields = (
  data: PatientCreate & PatientUpdate,
): PatientCreate => ({
  name: data.name,
  gender: data.gender,
  phone_number: data.phone_number,
  emergency_phone_number: data.emergency_phone_number,
  address: data.address,
  permanent_address: data.permanent_address,
  pincode: data.pincode,
  date_of_birth: data.date_of_birth,
  deceased_datetime: data.deceased_datetime,
  blood_group: data.blood_group,
  nationality: data.nationality,
  is_updated_offline: data.is_updated_offline,
  age: data.age,
  identifiers: data.identifiers,
  geo_organization: data.geo_organization,
  facility: data.facility,
  tags: data.tags,
});

export const normalizeOfflinePatientRecord = (
  entry: OfflineWritesEntry,
  user: AuthUserModel,
  selectedGeoLocation: Organization | null,
  selectedTags: TagConfig[],
  identifierforNormalize: PatientIdentifier[],
  permissions?: string[],
  created_date?: string,
  modified_date?: string,
): PatientRead => {
  const payload = entry?.payload as PatientUpdate | PatientCreate;
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
    blood_group: payload.blood_group ?? undefined,
    date_of_birth: payload.date_of_birth ?? undefined,
    year_of_birth: yob ?? 0,
    deceased_datetime: payload.deceased_datetime,

    created_date: created_date ? created_date : nowIso,
    modified_date: modified_date ? modified_date : nowIso,
    instance_tags: selectedTags ?? [],
    facility_tags: [],
    instance_identifiers: identifierforNormalize ?? [],

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
      profile_picture_url: user.profile_picture_url ?? "",
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
      profile_picture_url: user.profile_picture_url ?? "",
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
  patientData: PatientRead,
  authUser: AuthUserModel,
  selectedTags: TagConfig[],
  permissions?: string[],
  currentOrganizations?: FacilityOrganization[],
  created_by?: UserBase,
  created_date?: string,
  modified_date?: string,
): EncounterRead => {
  const payload = entry.payload as EncounterCreate;

  const facilityData = queryClient.getQueryData<FacilityData>([
    "facility",
    payload.facility,
  ]);
  return {
    id: entry.id,
    patient: patientData,
    facility: {
      id: facilityData?.id ?? "Unknown(offline)",
      name: facilityData?.name ?? "Unknown(offline)",
    },
    status: payload.status ?? "Unknown (offline)",
    encounter_class: payload.encounter_class ?? "Unknown (offline)",
    period: {
      start: payload.period?.start,
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
    organizations: currentOrganizations || [],
    current_location: null,
    location_history: [],
    permissions: permissions ?? [],
    care_team: [],
    discharge_summary_advice: payload?.discharge_summary_advice ?? undefined,
    is_updated_offline: true,
    tags: selectedTags ?? [],
  };
};

export const normaliZedResourcerequestRecord = (
  entry: OfflineWritesEntry,
  patientData: PatientRead | undefined,
  assigned_facility: FacilityModel | undefined,
  assignToUser: UserBase | undefined,
  queryClient: QueryClient,
  user: AuthUserModel,
  created_date?: string,
  modified_date?: string,
  approving_facility?: FacilityModel,
): ResourceRequest => {
  const payload = entry.payload as
    | UpdateResourceRequest
    | CreateResourceRequest;

  const nowIso = new Date(entry.clientTimestamp).toISOString();
  const originFacilityId = payload.origin_facility;
  let originfacility: FacilityModel | undefined;

  if (originFacilityId && originFacilityId !== "") {
    originfacility = queryClient.getQueryData<FacilityModel>([
      "facility",
      originFacilityId,
    ]);
  }
  return {
    approving_facility: approving_facility ?? null,
    assigned_facility: assigned_facility ?? undefined,
    category: payload.category ?? "-",
    emergency: payload.emergency ?? null,
    id: entry?.id,
    origin_facility: originfacility!,
    priority: payload.priority ?? null,
    reason: payload.reason ?? null,
    referring_facility_contact_name:
      payload.referring_facility_contact_name ?? "unknown(offline)",
    referring_facility_contact_number:
      payload.referring_facility_contact_number ?? "unknown(offline)",
    requested_quantity: 1,
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
  patientData: PatientRead,
  bookedBy: AuthUserModel | null,
  status: AppointmentNonCancelledStatus,
  practitioner: UserBase,
  facility: FacilityBareMinimum,
  selectedTags: TagConfig[],
): AppointmentRead => {
  const payload = entry.payload as AppointmentCreateRequest;
  const nowIso = new Date(entry.clientTimestamp).toISOString();
  return {
    id: entry.id,
    token_slot: selectedTokenSlot,
    patient: patientData ?? null,
    booked_on: nowIso,
    booked_by: bookedBy ? normalizeUserBase(bookedBy) : null,
    status: status,
    note: payload?.note,
    user: practitioner,
    facility: facility,
    is_updated_offline: true,
    modified_date: nowIso,
    updated_by: bookedBy ? normalizeUserBase(bookedBy) : null,
    created_by: bookedBy ? normalizeUserBase(bookedBy) : null,
    tags: selectedTags,
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
    profile_picture_url: authUser?.profile_picture_url ?? "",
    phone_number: authUser?.phone_number ?? "unknown(offline)",
    gender: authUser?.gender ?? "male",
    suffix: authUser?.suffix,
    prefix: authUser?.prefix,
    mfa_enabled: authUser?.mfa_enabled ?? false,
    deleted: authUser?.deleted ?? false,
  };
}

export const updateActiveEncounterList = ({
  queryClient,
  action,
  patientID,
  normalizeEncounter,
}: {
  queryClient: QueryClient;
  action: string;
  patientID: string;
  normalizeEncounter: EncounterRead;
}) => {
  const addEncounterToList = (
    EncouterList: PaginatedResponse<EncounterRead> | undefined,
    newEncounter: EncounterRead,
  ): PaginatedResponse<EncounterRead> => {
    const updatedList: PaginatedResponse<EncounterRead> = EncouterList?.results
      ? {
          ...EncouterList,
          results: [...EncouterList.results, newEncounter as EncounterRead],
          count: (EncouterList.count ?? EncouterList.results.length) + 1,
        }
      : {
          count: 1,
          results: [newEncounter as EncounterRead],
        };
    return updatedList;
  };

  if (action == "createEncounter" && normalizeEncounter) {
    const ActiveEncouterList = queryClient.getQueryData<
      PaginatedResponse<EncounterRead>
    >(["encounters", "live", patientID]);

    const newList = addEncounterToList(ActiveEncouterList, normalizeEncounter);

    queryClient.setQueryData(["encounters", "live", patientID], newList);
  } else if (action === "markAsCompleteEncounter" && normalizeEncounter) {
    const ActiveEncouterList = queryClient.getQueryData<
      PaginatedResponse<EncounterRead>
    >(["encounters", "live", patientID]);

    const UpdatedActiveEncounterList: PaginatedResponse<EncounterRead> =
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
  }
};

export const normalizedQuestionnairRequest = (
  questionnair: BatchRequestItem,
  allQuestionnairsList: QuestionnaireListResponse,
  authUser: AuthUserModel,
  patientID: string,
  encounterID?: string,
): QuestionnaireResponse => {
  const questionnaireMeta = allQuestionnairsList.results.find(
    (q) => q.id === questionnair.reference_id,
  );

  return {
    id: `offline-${crypto.randomUUID()}`,
    created_date: new Date().toISOString(),
    modified_date: new Date().toISOString(),
    questionnaire: questionnaireMeta
      ? {
          id: questionnaireMeta.id,
          slug: questionnaireMeta.slug,
          version: questionnaireMeta.version,
          code: questionnaireMeta.code,
          questions: questionnaireMeta.questions,
          title: questionnaireMeta.title,
          description: questionnaireMeta.description,
          status: questionnaireMeta.status,
          subject_type: questionnaireMeta.subject_type,
          tags: questionnaireMeta.tags,
        }
      : undefined,
    subject_id: encounterID ?? patientID,
    responses: questionnair.body.results ?? [],
    encounter: encounterID ?? null,
    patient: patientID,
    created_by: normalizeUserBase(authUser),
    is_updated_offline: true,
  };
};

function mergeAndUpdatePaginatedCache<T>(
  queryClient: QueryClient,
  keys: (string | undefined)[][],
  newEntries: T[],
) {
  for (const key of keys) {
    queryClient.setQueryData(key, (prev?: PaginatedResponse<T>) => {
      return {
        ...prev,
        count: (prev?.count ?? 0) + newEntries.length,
        results: [...(prev?.results ?? []), ...newEntries],
      };
    });
  }
}

function replaceEncounterScopedInPaginatedCache<
  T extends { encounter?: string },
>(
  queryClient: QueryClient,
  key: (string | undefined)[],
  encounterID: string | undefined,
  newEntries: T[],
) {
  const prevData = queryClient.getQueryData(key);

  const isInfiniteQuery = key[0]?.startsWith("infinite-");

  if (isInfiniteQuery) {
    queryClient.setQueryData(key, (prev: any) => {
      if (!prev?.pages) {
        return {
          pages: [
            {
              count: newEntries.length,
              results: newEntries,
            },
          ],
          pageParams: [0],
        };
      }

      const updatedPages = prev.pages.map((page: any, index: number) => {
        if (index === 0) {
          const filteredResults = (page.results || []).filter(
            (entry: any) => entry.encounter !== encounterID,
          );
          const merged = [...filteredResults, ...newEntries];

          return {
            ...page,
            results: merged,
            count: merged.length,
          };
        } else {
          return page;
        }
      });

      return {
        ...prev,
        pages: updatedPages,
      };
    });
  } else {
    const paginatedData = prevData as PaginatedResponse<T> | undefined;
    const filteredResults = (paginatedData?.results ?? []).filter(
      (entry) => entry.encounter !== encounterID,
    );

    const updatedData: PaginatedResponse<T> = {
      ...paginatedData,
      count: filteredResults.length + newEntries.length,
      results: [...filteredResults, ...newEntries],
    };

    queryClient.setQueryData(key, updatedData);
  }
}

export const normalizeAndUpdateDiagnosis = (
  queryClient: QueryClient,
  q: BatchRequestItem,
  authUser: AuthUserModel,
  patientID: string,
  encounterID?: string,
) => {
  const normalizedDiagnosisResult: Diagnosis[] = q.body?.datapoints.map(
    (d: any) => ({
      id: d.id ?? `offline-${crypto.randomUUID()}`,
      code: d.code,
      clinical_status: d.clinical_status,
      verification_status: d.verification_status,
      onset: d.onset,
      recorded_date: d.recorded_date ?? null,
      note: d.note,
      category: d.category,
      created_by: normalizeUserBase(authUser),
      updated_by: normalizeUserBase(authUser),
      encounter: d.encounter,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
      severity: d.severity ?? null,
      abatement: d.abatement ?? {},
    }),
  );

  const newCodes = new Set(normalizedDiagnosisResult.map((d) => d.code.code));

  queryClient.setQueryData(
    ["infinite-encounter_diagnosis", patientID, encounterID],
    (prev: any) => {
      if (!prev?.pages) {
        return {
          pages: [
            {
              count: normalizedDiagnosisResult.length,
              results: normalizedDiagnosisResult,
            },
          ],
          pageParams: [0],
        };
      }

      const updatedPages = prev.pages.map((page: any) => {
        const filteredResults = page.results.filter(
          (entry: any) => !newCodes.has(entry.code.code),
        );
        const merged = [...filteredResults, ...normalizedDiagnosisResult];

        return {
          ...page,
          results: merged,
          count: merged.length,
        };
      });

      return {
        ...prev,
        pages: updatedPages,
      };
    },
  );

  const existingDiagnoses =
    queryClient.getQueryData<PaginatedResponse<Diagnosis>>([
      "diagnoses",
      patientID,
      encounterID,
    ])?.results ?? [];

  const filteredResults = existingDiagnoses.filter(
    (entry) => !newCodes.has(entry.code.code),
  );

  const mergedDiagnoses = [...filteredResults, ...normalizedDiagnosisResult];

  queryClient.setQueryData(
    ["diagnoses", patientID, encounterID],
    (prev: PaginatedResponse<Diagnosis> | undefined) => {
      return {
        ...prev,
        count: mergedDiagnoses.length,
        results: mergedDiagnoses,
      };
    },
  );

  replaceEncounterScopedInPaginatedCache<Diagnosis>(
    queryClient,
    ["infinite-encounter_diagnosis", patientID, undefined],
    encounterID,
    mergedDiagnoses,
  );
};

export const normalizeAndUpdateMedication_Request = (
  queryClient: QueryClient,
  q: BatchRequestItem,
  patientID: string,
  encounterID?: string,
) => {
  const normaizedMedication_RequestResult: MedicationRequestRead[] =
    q.body?.datapoints.map((d: any) => {
      return {
        id: d.id ?? `offline-${crypto.randomUUID()}`,
        status: d.status,
        status_reason: d.status_reason,
        intent: d.intent,
        category: d.category,
        priority: d.priority,
        do_not_perform: d.do_not_perform,
        medication: d.medication,
        encounter: d.encounter,
        dosage_instruction: d.dosage_instruction,
        note: d.note,
        created_date: d.created_date,
        modified_date: d.modified_date,
        created_by: d.created_by,
        updated_by: d.updated_by,
        authored_on: d.authored_on,
      };
    });
  queryClient.removeQueries({
    queryKey: ["medication_requests", patientID, encounterID],
  });
  queryClient.removeQueries({
    queryKey: ["medication_requests_active", patientID, encounterID],
  });

  mergeAndUpdatePaginatedCache<MedicationRequestRead>(
    queryClient,
    [
      ["medication_requests", patientID, encounterID],
      ["medication_requests_active", patientID, encounterID],
    ],
    normaizedMedication_RequestResult,
  );
};

export const normalizeAndUpdateSymptom = async (
  queryClient: QueryClient,
  q: BatchRequestItem,
  authUser: AuthUserModel,
  patientID: string,
  encounterID?: string,
) => {
  const normalizedSymptomResult: Symptom[] = q.body?.datapoints.map(
    (d: any) => {
      return {
        id: d.id ?? `offline-${crypto.randomUUID()}`,
        code: d.code,
        clinical_status: d.clinical_status,
        verification_status: d.verification_status,
        severity: d.severity,
        onset: d.onset,
        recorded_date: d.recorded_date ?? null,
        note: d.note,
        created_by: normalizeUserBase(authUser),
        updated_by: normalizeUserBase(authUser),
        category: d.category,
        encounter: d.encounter,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        abatement: d.abatement ?? {},
      };
    },
  );

  queryClient.setQueryData(
    ["infinite-symptoms", patientID, encounterID],
    (prev: any) => {
      if (!prev?.pages) {
        return {
          pages: [
            {
              count: normalizedSymptomResult.length,
              results: normalizedSymptomResult,
            },
          ],
          pageParams: [0],
        };
      }

      const updatedPages = prev.pages.map((page: any, index: number) => {
        if (index === 0) {
          return {
            ...page,
            results: normalizedSymptomResult,
            count: normalizedSymptomResult.length,
          };
        } else {
          return page;
        }
      });

      return {
        ...prev,
        pages: updatedPages,
      };
    },
  );

  queryClient.setQueryData(
    ["symptoms", patientID, encounterID],
    (prev: PaginatedResponse<Symptom> | undefined) => {
      if (!prev) {
        return {
          count: normalizedSymptomResult.length,
          results: normalizedSymptomResult,
        };
      }

      return {
        ...prev,
        results: normalizedSymptomResult,
        count: normalizedSymptomResult.length,
      };
    },
  );

  replaceEncounterScopedInPaginatedCache<Symptom>(
    queryClient,
    ["infinite-symptoms", patientID, undefined],
    encounterID,
    normalizedSymptomResult,
  );
};

export const normalizeAndUpdateMedication_Statement = (
  queryClient: QueryClient,
  q: BatchRequestItem,
  authUser: AuthUserModel,
  patientID: string,
  encounterID?: string,
) => {
  const normalizeMedication_Statement: MedicationStatementRead[] =
    q.body?.datapoints.map((d: any) => {
      return {
        id: d.id ?? `offline-${crypto.randomUUID()}`,
        status: d.status,
        reason: d.reason,
        medication: d.medication,
        dosage_text: d.dosage_text,
        effective_period: d.effective_period,
        encounter: d.encounter,
        information_source: d.information_source,
        note: d.note,
        created_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
        created_by: normalizeUserBase(authUser),
        updated_by: normalizeUserBase(authUser),
      };
    });

  queryClient.setQueryData(
    ["infinite-medication_statements", patientID, encounterID],
    (prev: any) => {
      if (!prev?.pages) {
        return {
          pages: [
            {
              count: normalizeMedication_Statement.length,
              results: normalizeMedication_Statement,
            },
          ],
          pageParams: [0],
        };
      }

      const updatedPages = prev.pages.map((page: any, index: number) => {
        if (index === 0) {
          return {
            ...page,
            results: normalizeMedication_Statement,
            count: normalizeMedication_Statement.length,
          };
        } else {
          return page;
        }
      });

      return {
        ...prev,
        pages: updatedPages,
      };
    },
  );

  queryClient.setQueryData(
    ["medication_statements", patientID, encounterID],
    (prev: PaginatedResponse<MedicationStatementRead> | undefined) => {
      if (!prev) {
        return {
          count: normalizeMedication_Statement.length,
          results: normalizeMedication_Statement,
        };
      }

      return {
        ...prev,
        results: normalizeMedication_Statement,
        count: normalizeMedication_Statement.length,
      };
    },
  );

  replaceEncounterScopedInPaginatedCache<MedicationStatementRead>(
    queryClient,
    ["infinite-medication_statements", patientID, undefined],
    encounterID,
    normalizeMedication_Statement,
  );
};

export const normalizeAndUpdateAllergy_Intolerance = (
  queryClient: QueryClient,
  q: BatchRequestItem,
  authUser: AuthUserModel,
  patientID: string,
  encounterID?: string,
) => {
  const normalizedAllergyResult: AllergyIntolerance[] = q.body?.datapoints.map(
    (d: any) => {
      return {
        id: d.id ?? `offline-${crypto.randomUUID()}`,
        code: d.code,
        clinical_status: d.clinical_status,
        verification_status: d.verification_status,
        category: d.category,
        criticality: d.criticality,
        last_occurrence: d.last_occurrence,
        note: d.note,
        created_by: normalizeUserBase(authUser),
        encounter: encounterID,
        updated_by: normalizeUserBase(authUser),
        allergy_intolerance_type: "allergy",
        onset: d.id ?? {},
        recorded_date: null,
      };
    },
  );

  queryClient.setQueryData(["infinite-allergies", patientID], (prev: any) => {
    if (!prev?.pages) {
      return {
        pages: [
          {
            count: normalizedAllergyResult.length,
            results: normalizedAllergyResult,
          },
        ],
        pageParams: [0],
      };
    }

    const updatedPages = prev.pages.map((page: any, index: number) => {
      if (index === 0) {
        return {
          ...page,
          results: normalizedAllergyResult,
          count: normalizedAllergyResult.length,
        };
      } else {
        return page;
      }
    });

    return {
      ...prev,
      pages: updatedPages,
    };
  });

  queryClient.setQueryData(
    ["allergies", patientID],
    (prev: PaginatedResponse<AllergyIntolerance> | undefined) => {
      if (!prev) {
        return {
          count: normalizedAllergyResult.length,
          results: normalizedAllergyResult,
        };
      }

      return {
        ...prev,
        results: normalizedAllergyResult,
        count: normalizedAllergyResult.length,
      };
    },
  );
};

export const normalizeAndUpdateEncounter = (
  queryClient: QueryClient,
  q: BatchRequestItem,
  patientID: string,
  encounterID?: string,
) => {
  const PrevEncounterData = queryClient.getQueryData<EncounterRead>([
    "encounter",
    encounterID,
  ]);
  if (!PrevEncounterData) return;
  const updatedEncounterData: EncounterRead = {
    ...PrevEncounterData,
    status: q.body?.status,
    encounter_class: q.body?.encounter_class,
    period: q.body?.period,
    hospitalization: q.body?.hospitalization,
    priority: q.body?.priority,
    external_identifier: q.body?.external_identifier,
    discharge_summary_advice: q.body?.discharge_summary_advice,
    is_updated_offline: true,
  };

  queryClient.setQueryData(["encounter", encounterID], updatedEncounterData);

  if (PrevEncounterData.status !== q.body?.status) {
    const allergyData = queryClient.getQueryData<
      PaginatedResponse<AllergyIntolerance>
    >(["allergies", patientID, encounterID, PrevEncounterData.status]);

    queryClient.setQueryData(
      ["allergies", patientID, encounterID, q.body?.status],
      allergyData,
    );

    queryClient.removeQueries({
      queryKey: ["allergies", patientID, encounterID, PrevEncounterData.status],
    });
  }
};

export const cacheQuestionnairResponse = (
  queryClient: QueryClient,
  questionnairpaylod: BatchRequestBody,
  authUser: AuthUserModel,
  patientID: string,
  encounterID?: string,
  subjectType?: string,
) => {
  const allQuestionnairsList =
    queryClient.getQueryData<QuestionnaireListResponse>([
      "questionnaires",
      "list",
      "",
      subjectType,
    ]);

  if (!allQuestionnairsList) return;

  const normalizedQuestionnairResponse: QuestionnaireResponse[] =
    questionnairpaylod.requests.map((questionnair) =>
      normalizedQuestionnairRequest(
        questionnair,
        allQuestionnairsList,
        authUser,
        patientID,
        encounterID,
      ),
    );

  queryClient.setQueryDefaults(["offlineCreatedQuestionnaireResponses"], {
    meta: { persist: true },
    networkMode: "online",
  });

  queryClient.setQueryData<QuestionnaireResponse[]>(
    ["offlineCreatedQuestionnaireResponses", encounterID ?? patientID],
    (prev = []) => [...prev, ...normalizedQuestionnairResponse],
  );
};

export const handleOfflineRecordSuccess = async (
  offlineEntryId: string,
  serverResponse: any,
): Promise<void> => {
  const db = new AppCacheDB();

  try {
    const entry = await db.OfflineWrites.get(offlineEntryId);
    if (!entry) {
      console.warn(
        `Offline entry ${offlineEntryId} not found for success handling`,
      );
      return;
    }

    await markWriteStatus(entry.id, "success", {
      response: serverResponse,
      lastAttemptAt: Date.now(),
    });

    await processDependentWrites(entry.id);
  } catch (error) {
    console.error(
      `Error handling offline record success for ${offlineEntryId}:`,
      error,
    );
    throw error;
  }
};

export async function checkParentSyncStatus(parentId?: string): Promise<{
  isSynced: boolean;
  parentId?: string;
}> {
  if (!parentId) {
    return {
      isSynced: true,
      parentId,
    };
  }

  try {
    const db = new AppCacheDB();
    const parentWrite = await db.OfflineWrites.get(parentId);

    if (!parentWrite) {
      return {
        isSynced: false,
        parentId,
      };
    }

    if (parentWrite.syncStatus === "success") {
      return { isSynced: true, parentId };
    }

    return {
      isSynced: false,
      parentId,
    };
  } catch (error) {
    console.error("Error checking parent sync status:", error);
    return {
      isSynced: false,
      parentId,
    };
  }
}

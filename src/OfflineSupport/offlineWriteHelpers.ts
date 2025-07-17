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
  Encounter,
  EncounterEditRequest,
  EncounterRequest,
} from "@/types/emr/encounter/encounter";
import { MedicationRequestRead } from "@/types/emr/medicationRequest/medicationRequest";
import { MedicationStatementRead } from "@/types/emr/medicationStatement";
import {
  Patient,
  PatientCreate,
  PatientRead,
  PatientUpdate,
} from "@/types/emr/patient/patient";
import { Symptom } from "@/types/emr/symptom/symptom";
import { TagConfig } from "@/types/emr/tagConfig/tagConfig";
import { FacilityBareMinimum, FacilityData } from "@/types/facility/facility";
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
  mutationSyncRouteKey: OfflineKey;
  mutationPathParams?: Record<string, any>;
  mutationQueryParams?: Record<string, any>;
  type: OfflineKey;
  resourceType?: string;
  payload: unknown;
  parentMutationIds?: string[];
  serverTimestamp?: string;
  useQueryRouteKey?: string;
  useQueryPathParams?: Record<string, any>;
  useQueryParams?: Record<string, any>;
};
const db = new AppCacheDB();
export const saveOfflineWrite = async ({
  id,
  userId,
  mutationSyncRouteKey,
  type,
  resourceType,
  mutationPathParams,
  mutationQueryParams,
  payload,
  parentMutationIds,
  serverTimestamp,
  useQueryRouteKey,
  useQueryPathParams,
  useQueryParams,
}: saveOfflineWriteData): Promise<SaveOfflineWriteResult> => {
  const writeEntry = {
    id,
    userId,
    mutationSyncRouteKey,
    type,
    resourceType,
    mutationPathParams,
    mutationQueryParams,
    payload,
    parentMutationIds,

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
    instance_tags: selectedTags ?? [], // change needed
    facility_tags: [], // change needed
    instance_identifiers: identifierforNormalize ?? [], // change needed

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
  const payload = entry.payload as EncounterEditRequest | EncounterRequest; // Encounter Request in case use normalizing function after updating encounter

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
    tags: [],
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
  patientData: Patient,
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
    reason_for_visit: payload?.reason_for_visit,
    user: practitioner,
    facility: facility,
    is_updated_offline: true,
    modified_date: nowIso,
    updated_by: bookedBy ? normalizeUserBase(bookedBy) : null,
    created_by: bookedBy ? normalizeUserBase(bookedBy) : null,
    tags: selectedTags, // have to done changes here
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

export const updateActiveEncounterList = ({
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
  const prevData = queryClient.getQueryData<PaginatedResponse<T>>(key);

  const filteredResults = (prevData?.results ?? []).filter(
    (entry) => entry.encounter !== encounterID,
  );

  const updatedData: PaginatedResponse<T> = {
    ...prevData,
    count: filteredResults.length + newEntries.length,
    results: [...filteredResults, ...newEntries],
  };

  queryClient.setQueryData(key, updatedData);
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

  const cacheKeys = [
    ["encounter_diagnosis", patientID, encounterID],
    ["diagnoses", patientID, encounterID],
  ];

  for (const key of cacheKeys) {
    const prev = queryClient.getQueryData<PaginatedResponse<Diagnosis>>(key);

    const filteredResults = prev
      ? prev.results.filter((entry) => !newCodes.has(entry.code.code))
      : [];

    const merged = [...filteredResults, ...normalizedDiagnosisResult];
    console.log("merged : ", key, merged);
    queryClient.setQueryData<PaginatedResponse<Diagnosis>>(key, {
      ...prev,
      count: merged.length,
      results: merged,
    });
    console.log(key, queryClient.getQueryData(key));
  }
  // Update patietn-scoped cache
  const encounterDiagnosisResults =
    queryClient.getQueryData<PaginatedResponse<Diagnosis>>([
      "encounter_diagnosis",
      patientID,
      encounterID,
    ])?.results ?? normalizedDiagnosisResult;

  replaceEncounterScopedInPaginatedCache<Diagnosis>(
    queryClient,
    ["encounter_diagnosis", patientID, undefined],
    encounterID,
    encounterDiagnosisResults,
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

  /* No need for replce as we dont show medication request per patient
  replaceEncounterScopedInPaginatedCache<MedicationRequestRead>(
    queryClient,
    ["medication_requests_active", patientID, encounterID],
    encounterID,
    normaizedMedication_RequestResult,
  );
  **/
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

  queryClient.removeQueries({ queryKey: ["symptoms", patientID, encounterID] });

  mergeAndUpdatePaginatedCache<Symptom>(
    queryClient,
    [["symptoms", patientID, encounterID]],
    normalizedSymptomResult,
  );
  replaceEncounterScopedInPaginatedCache<Symptom>(
    queryClient,
    ["symptoms", patientID, undefined],
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

  queryClient.removeQueries({
    queryKey: ["medication_statements", patientID, encounterID],
  });
  mergeAndUpdatePaginatedCache<MedicationStatementRead>(
    queryClient,
    [["medication_statements", patientID, encounterID]],
    normalizeMedication_Statement,
  );
  replaceEncounterScopedInPaginatedCache<MedicationStatementRead>(
    queryClient,
    ["medication_statements", patientID, undefined],
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

  queryClient.removeQueries({
    queryKey: ["allergies", patientID],
  });

  mergeAndUpdatePaginatedCache<AllergyIntolerance>(
    queryClient,
    [["allergies", patientID]],
    normalizedAllergyResult,
  );
};

export const normalizeAndUpdateEncounter = (
  queryClient: QueryClient,
  q: BatchRequestItem,
  patientID: string,
  encounterID?: string,
) => {
  const PrevEncounterData = queryClient.getQueryData<Encounter>([
    "encounter",
    encounterID,
  ]);
  if (!PrevEncounterData) return;
  const updatedEncounterData: Encounter = {
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
    // set allergy data with new key if status change
    queryClient.setQueryData(
      ["allergies", patientID, encounterID, q.body?.status],
      allergyData,
    );

    // Remove old key
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

  // Cache the newly submitted offline questionnaire responses
  queryClient.setQueryDefaults(["offlineCreatedQuestionnaireResponses"], {
    meta: { persist: true },
    networkMode: "online",
  });

  queryClient.setQueryData<QuestionnaireResponse[]>(
    ["offlineCreatedQuestionnaireResponses", encounterID ?? patientID],
    (prev = []) => [...prev, ...normalizedQuestionnairResponse],
  );
};

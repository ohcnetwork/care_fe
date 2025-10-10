import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { OfflineKeyMap } from "@/OfflineSupport/offlineKeys";
import {
  cacheNonStructuredQuestionnairResponse,
  isOfflineId,
  normalizeAndUpdateAllergy_Intolerance,
  normalizeAndUpdateDiagnosis,
  normalizeAndUpdateEncounter,
  normalizeAndUpdateMedication_Request,
  normalizeAndUpdateMedication_Statement,
  normalizeAndUpdateSymptom,
  saveOfflineWrite,
} from "@/OfflineSupport/offlineWriteHelpers";
import { BatchRequestBody } from "@/types/base/batch/batch";
import { PatientRead } from "@/types/emr/patient/patient";

import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import { CurrentUserRead } from "@/types/user/user";
import {
  STRUCTURED_QUESTIONS,
  StructuredQuestionType,
} from "./data/StructuredFormData";

interface QueueQuestionnaireBatchRequestParams {
  questionnairPaylod: BatchRequestBody;
  queryClient: QueryClient;
  authUser: CurrentUserRead;
  patientId: string;
  encounterId: string | undefined;
  facilityId: string;
  t: (key: string, params?: any) => string;
  db: AppCacheDB;
  filledQuestionnaires: QuestionnaireDetail[];
  onSuccess?: () => void;
  onError?: (error: any) => void;
}
// Utility functions
export const assertNever = (x: never): never => {
  throw new Error(`Unhandled structured questionnaire: ${x}`);
};

export function cleanForCreate<T extends Record<string, any>>(entry: T): T {
  const cleaned = { ...entry };
  delete cleaned.id;
  delete cleaned.created_date;
  delete cleaned.updated_date;
  delete cleaned.created_by;
  delete cleaned.modified_date;
  delete cleaned.updated_by;
  return cleaned;
}

// for files/appointment/timeof death types question
export const generateAppendOnlyBatchAndQueue = async (
  reference_id: string,
  queryClient: QueryClient,
  authUser: CurrentUserRead,
  originalPayload: BatchRequestBody,
  patientID: string,
  encounterId: string | undefined,
  facilityId: string,
  t: (key: string, params?: any) => string,
  _db: AppCacheDB,
) => {
  const scopeID = encounterId ?? patientID;
  if (!scopeID) return;
  const parentID = encounterId ? encounterId : patientID;
  const matchingRequests = originalPayload.requests.filter(
    (req) => req.reference_id === reference_id,
  );
  if (matchingRequests.length === 0) return;

  for (const req of matchingRequests) {
    const generatedId = `offline-${reference_id}-${crypto.randomUUID()}`;
    const newOfflineEntry = {
      id: generatedId,
      userId: authUser.id,
      facilityId: facilityId,
      mutationSyncRouteKey:
        OfflineKeyMap[reference_id as keyof typeof OfflineKeyMap],
      type: OfflineKeyMap[reference_id as keyof typeof OfflineKeyMap],
      resourceType: "Questionnaire",
      payload: {
        requests: [req],
      },
      parentMutationId: isOfflineId(parentID) ? parentID : undefined,
    };

    const saveResult = await saveOfflineWrite(newOfflineEntry);
    if (!saveResult.success) {
      toast.error(
        t("failed_to_queue_for_offline_submission", {
          reference: reference_id.replace(/_/g, " "),
        }),
      );
      return;
    }

    if (reference_id === "time_of_death") {
      const deceasedDatetime = req.body?.deceased_datetime;

      if (deceasedDatetime) {
        queryClient.setQueryData<PatientRead>(
          ["patient", patientID],
          (prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              deceased_datetime: deceasedDatetime,
            };
          },
        );
      }
    }
  }
};

export const generateDiagnosisBatchAndQueue = async (
  queryClient: QueryClient,
  authUser: CurrentUserRead,
  originalPayload: BatchRequestBody,
  patientID: string,
  encounterId: string | undefined,
  facilityId: string,
  t: (key: string, params?: any) => string,
  db: AppCacheDB,
) => {
  if (!encounterId) return;
  const parentID = encounterId ? encounterId : patientID;
  const recordId = `offline-${encounterId}-diagnosis`;

  const matchingRequests = originalPayload.requests.filter(
    (req) => req.reference_id === "diagnosis",
  );
  if (matchingRequests.length === 0) return;

  // Extract new datapoints & remove offline-ids
  const newDatapoints: any[] = [];
  matchingRequests.forEach((req) => {
    req.body?.datapoints?.forEach((dp: any) => {
      let copy = { ...dp };
      if (copy.id?.startsWith("offline-")) {
        // Remove id and metadata from offline-created items to avoid backend treating them as updates instead of create.
        copy = cleanForCreate(copy);
      }
      newDatapoints.push(copy);
    });
  });

  //  Load existing offline record
  const existing = await db.OfflineWrites.get(recordId);
  let oldDatapoints: any[] = [];
  const existingPayload = existing?.payload as BatchRequestBody;
  if (existingPayload?.requests?.[0]?.body?.datapoints) {
    oldDatapoints = existingPayload.requests[0].body.datapoints;
  }

  const newCodes = new Set(newDatapoints.map((dp) => dp.code?.code));
  const mergedDatapoints = [
    ...oldDatapoints.filter((dp: any) => !newCodes.has(dp.code?.code)),
    ...newDatapoints,
  ];

  if (matchingRequests.length === 0) return; // Early exit if nothing to process

  //  Last submitted request
  const baseRequest = matchingRequests.at(-1)!;

  const cleanedRequests: BatchRequestBody = {
    requests: [
      {
        url: baseRequest.url,
        method: baseRequest.method,
        reference_id: baseRequest.reference_id,
        body: {
          ...baseRequest.body,
          datapoints: mergedDatapoints,
        },
      },
    ],
  };

  try {
    await db.OfflineWrites.delete(recordId);

    const newOfflineEntry = {
      id: recordId,
      userId: authUser.id,
      facilityId: facilityId,
      mutationSyncRouteKey: OfflineKeyMap.diagnosis,
      type: OfflineKeyMap.diagnosis,
      resourceType: "Questionnaire",
      payload: cleanedRequests,
      parentMutationId: isOfflineId(parentID) ? parentID : undefined,
    };

    const saveResult = await saveOfflineWrite(newOfflineEntry);
    if (!saveResult.success) {
      toast.error(
        t("failed_to_queue_item_for_offline_submission", {
          item: "diagnosis",
        }),
      );
      return;
    }

    normalizeAndUpdateDiagnosis(
      queryClient,
      cleanedRequests.requests[0],
      authUser,
      patientID,
      encounterId,
    );
  } catch (err) {
    console.error("Error saving offline diagnosis", err);
    toast.error(
      t("unexpected_error_while_saving_offline", { item: "diagnosis" }),
    );
  }
};

export const generateFixedDatapointTypeBatchAndQueue = async (
  reference_id: string,
  queryClient: QueryClient,
  authUser: CurrentUserRead,
  originalPayload: BatchRequestBody,
  patientID: string,
  encounterId: string | undefined,
  facilityId: string,
  t: (key: string, params?: any) => string,
  db: AppCacheDB,
) => {
  if (!encounterId) return;
  const isPatientScoped = ["allergy_intolerance"].includes(reference_id);
  const scopeID = isPatientScoped ? patientID : encounterId;
  if (!scopeID) return;
  const parentID = encounterId ? encounterId : patientID;
  const recordId = `offline-${scopeID}-${reference_id}`;

  const matchingRequests = originalPayload.requests.filter(
    (req) => req.reference_id === reference_id,
  );
  if (matchingRequests.length === 0) return;

  const mergedDatapoints: any[] = [];
  matchingRequests.forEach((req) => {
    req.body?.datapoints?.forEach((dp: any) => {
      let copy = { ...dp };

      if (copy.id?.startsWith("offline-")) {
        // Remove id and metadata from offline-created items to avoid backend treating them as updates.
        copy = cleanForCreate(copy);
      }
      mergedDatapoints.push(copy);
    });
  });

  const baseRequest = matchingRequests[0];
  const cleanedRequests: BatchRequestBody = {
    requests: [
      {
        ...baseRequest,
        body: {
          ...baseRequest.body,
          datapoints: mergedDatapoints,
        },
      },
    ],
  };

  try {
    await db.OfflineWrites.delete(recordId);

    const newOfflineEntry = {
      id: recordId,
      userId: authUser.id,
      facilityId: facilityId,
      mutationSyncRouteKey:
        OfflineKeyMap[reference_id as keyof typeof OfflineKeyMap],
      type: OfflineKeyMap[reference_id as keyof typeof OfflineKeyMap],
      resourceType: "Questionnaire",
      payload: cleanedRequests,
      parentMutationId: isOfflineId(parentID) ? parentID : undefined,
    };

    const saveResult = await saveOfflineWrite(newOfflineEntry);
    if (!saveResult.success) {
      toast.error(
        t("failed_to_queue_for_offline_submission", {
          reference: reference_id.replace("_", " "),
        }),
      );
      return;
    }

    const normalizedRequest = cleanedRequests.requests[0];

    switch (reference_id) {
      case "allergy_intolerance":
        normalizeAndUpdateAllergy_Intolerance(
          queryClient,
          normalizedRequest,
          authUser,
          patientID,
          encounterId,
        );
        break;
      case "symptom":
        normalizeAndUpdateSymptom(
          queryClient,
          normalizedRequest,
          authUser,
          patientID,
          encounterId,
        );
        break;
      case "medication_request":
        normalizeAndUpdateMedication_Request(
          queryClient,
          normalizedRequest,
          patientID,
          encounterId,
        );
        break;
      case "medication_statement":
        normalizeAndUpdateMedication_Statement(
          queryClient,
          normalizedRequest,
          authUser,
          patientID,
          encounterId,
        );
        break;
    }
  } catch (err) {
    console.error("Error saving offline datapoint-type questionnaire", err);
    toast.error(
      t("unexpected_error_while_saving_offline", { item: reference_id }),
    );
  }
};

export const generateEncounterBatchAndQueue = async (
  queryClient: QueryClient,
  authUser: CurrentUserRead,
  originalPayload: BatchRequestBody,
  patientID: string,
  encounterId: string | undefined,
  facilityId: string,
  t: (key: string, params?: any) => string,
  db: AppCacheDB,
) => {
  if (!encounterId) return;
  const parentID = encounterId!; // safe to use ! as already return if no encounter ID
  const recordId = `offline-${encounterId}-encounter`;

  const matchingRequests = originalPayload.requests.filter(
    (req) => req.reference_id === "encounter",
  );
  if (matchingRequests.length === 0) return;

  const baseRequest = matchingRequests[matchingRequests.length - 1];

  const cleanedRequests: BatchRequestBody = {
    requests: [baseRequest],
  };

  try {
    await db.OfflineWrites.delete(recordId);

    const newOfflineEntry = {
      id: recordId,
      userId: authUser.id,
      facilityId: facilityId,
      mutationSyncRouteKey: OfflineKeyMap.encounter,
      type: OfflineKeyMap.encounter,
      resourceType: "Questionnaire",
      payload: cleanedRequests,
      parentMutationId: isOfflineId(parentID) ? parentID : undefined,
    };

    const saveResult = await saveOfflineWrite(newOfflineEntry);
    if (!saveResult.success) {
      toast.error(
        t("failed_to_queue_item_for_offline_submission", {
          item: "encounter",
        }),
      );
      return;
    }

    normalizeAndUpdateEncounter(
      queryClient,
      baseRequest,
      patientID,
      encounterId,
    );
  } catch (err) {
    console.error("Error saving offline encounter questionnaire", err);
    toast.error(
      t("unexpected_error_while_saving_offline", { item: "encounter" }),
    );
  }
};

export const queueQuestionnairBatchrequest = async ({
  questionnairPaylod,
  queryClient,
  authUser,
  patientId,
  encounterId,
  facilityId,
  t,
  db,
  filledQuestionnaires,
  onSuccess,
  onError,
}: QueueQuestionnaireBatchRequestParams) => {
  const parentID = encounterId ? encounterId : patientId;

  try {
    const structuredQuestionnaires = questionnairPaylod.requests.filter(
      (
        q,
      ): q is (typeof questionnairPaylod.requests)[number] & {
        reference_id: StructuredQuestionType;
      } => STRUCTURED_QUESTIONS.some((s) => s.value === q.reference_id),
    );
    const nonStructuredQuestionnaires = questionnairPaylod.requests.filter(
      (q) => !STRUCTURED_QUESTIONS.some((s) => s.value === q.reference_id),
    );

    for (const fixedQ of structuredQuestionnaires) {
      switch (fixedQ.reference_id) {
        case "encounter":
          await generateEncounterBatchAndQueue(
            queryClient,
            authUser,
            questionnairPaylod,
            patientId,
            encounterId,
            facilityId,
            t,
            db,
          );
          break;

        case "diagnosis":
          await generateDiagnosisBatchAndQueue(
            queryClient,
            authUser,
            questionnairPaylod,
            patientId,
            encounterId,
            facilityId,
            t,
            db,
          );
          break;

        case "files":
        case "appointment":
        case "time_of_death":
          await generateAppendOnlyBatchAndQueue(
            fixedQ.reference_id,
            queryClient,
            authUser,
            questionnairPaylod,
            patientId,
            encounterId,
            facilityId,
            t,
            db,
          );
          break;

        case "allergy_intolerance":
        case "medication_request":
        case "symptom":
        case "medication_statement":
          await generateFixedDatapointTypeBatchAndQueue(
            fixedQ.reference_id,
            queryClient,
            authUser,
            questionnairPaylod,
            patientId,
            encounterId,
            facilityId,
            t,
            db,
          );
          break;

        default:
          break;
      }
    }

    if (nonStructuredQuestionnaires.length <= 0) {
      onSuccess?.();
      return;
    }
    // saved non fixed question types
    const generatedId = `offline-${crypto.randomUUID()}`;

    const offlineEntry = {
      id: generatedId,
      userId: authUser.id,
      facilityId: facilityId,
      mutationSyncRouteKey: OfflineKeyMap.non_structured_questionnaire,
      type: OfflineKeyMap.non_structured_questionnaire,
      resourceType: "Questionnaire",
      payload: { requests: nonStructuredQuestionnaires },
      parentMutationId: isOfflineId(parentID) ? parentID : undefined,
    };

    const saveResult = await saveOfflineWrite(offlineEntry);
    if (!saveResult.success) {
      toast.error(t("unable_to_queue_non_structured_questions"));
      onError?.(new Error("Failed to save offline entry"));
      return;
    }

    cacheNonStructuredQuestionnairResponse(
      queryClient,
      { requests: nonStructuredQuestionnaires },
      authUser,
      patientId,
      filledQuestionnaires,
      encounterId,
    );

    onSuccess?.();
  } catch (error) {
    console.error("Error while submit Questionnaire", error);
    toast.error(
      t("unexpected_error_while_saving_offline", { item: "questionnair" }),
    );
    onError?.(error);
  }
};

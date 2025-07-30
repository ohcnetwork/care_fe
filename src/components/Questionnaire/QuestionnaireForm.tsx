import {
  QueryClient,
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useNavigationPrompt } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { DebugPreview } from "@/components/Common/DebugPreview";
import Loading from "@/components/Common/Loading";
import { AuthUserModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { OfflineKeyMap } from "@/OfflineSupport/offlineKeys";
import {
  cacheQuestionnairResponse,
  isOfflineId,
  normalizeAndUpdateAllergy_Intolerance,
  normalizeAndUpdateDiagnosis,
  normalizeAndUpdateEncounter,
  normalizeAndUpdateMedication_Request,
  normalizeAndUpdateMedication_Statement,
  normalizeAndUpdateSymptom,
  saveOfflineWrite,
} from "@/OfflineSupport/offlineWriteHelpers";
import { PLUGIN_Component } from "@/PluginEngine";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { dateQueryString } from "@/Utils/utils";
import { BatchRequestBody } from "@/types/base/batch/batch";
import { MedicationRequest } from "@/types/emr/medicationRequest/medicationRequest";
import { MedicationStatementRequest } from "@/types/emr/medicationStatement";
import { PatientRead } from "@/types/emr/patient/patient";
import { FileUploadQuestion } from "@/types/files/files";
import {
  DetailedValidationError,
  QuestionValidationError,
  ValidationErrorResponse,
} from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import {
  type Question,
  findQuestionById,
} from "@/types/questionnaire/question";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import { CreateAppointmentQuestion } from "@/types/scheduling/schedule";

import { QuestionRenderer } from "./QuestionRenderer";
import { validateAppointmentQuestion } from "./QuestionTypes/AppointmentQuestion";
import { validateFileUploadQuestion } from "./QuestionTypes/FileQuestion";
import { validateMedicationRequestQuestion } from "./QuestionTypes/MedicationRequestQuestion";
import { validateMedicationStatementQuestion } from "./QuestionTypes/MedicationStatementQuestion";
import { isQuestionEnabled } from "./QuestionTypes/QuestionGroup";
import { QuestionnaireSearch } from "./QuestionnaireSearch";
import {
  FIXED_QUESTIONNAIRES,
  STRUCTURED_QUESTIONS,
  StructuredQuestionnaireReferenceId,
} from "./data/StructuredFormData";
import { getStructuredRequests } from "./structured/handlers";

export interface QuestionnaireFormState {
  questionnaire: QuestionnaireDetail;
  responses: QuestionnaireResponse[];
  errors: QuestionValidationError[];
}

interface FormBatchRequest {
  url: string;
  method: string;
  body: Record<string, any>;
  reference_id: string;
}

interface ServerValidationError {
  reference_id: string;
  message: string;
  status_code: number;
}

export interface QuestionnaireFormProps {
  questionnaireSlug?: string;
  patientId: string;
  encounterId?: string;
  subjectType?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  facilityId?: string;
}

interface ValidationErrorDisplayProps {
  questionnaireForms: QuestionnaireFormState[];
  serverErrors?: ServerValidationError[];
}

function ValidationErrorDisplay({
  questionnaireForms,
  serverErrors,
}: ValidationErrorDisplayProps) {
  const { t } = useTranslation();

  const hasErrors =
    questionnaireForms.some((form) => form.errors.length > 0) ||
    (serverErrors?.length ?? 0) > 0;

  if (!hasErrors) return null;

  const findQuestionText = (
    form: QuestionnaireFormState,
    questionId: string,
  ): string | undefined => {
    const findInQuestions = (questions: Question[]): string | undefined => {
      for (const q of questions) {
        if (q.id === questionId) return q.text;
        if (q.type === "group" && q.questions) {
          const found = findInQuestions(q.questions);
          if (found) return found;
        }
      }
    };
    return (
      findInQuestions(form.questionnaire.questions) || t("unknown_question")
    );
  };

  const getErrorTitle = (error: ServerValidationError) => {
    // Find matching questionnaire title first
    const form = questionnaireForms.find(
      (f) => f.questionnaire.id === error.reference_id,
    );
    if (form) {
      return form.questionnaire.title;
    }

    // For other cases, transform the reference_id into a readable title
    return error.reference_id
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const findStructuredQuestionId = (
    forms: QuestionnaireFormState[],
    structuredType: string,
  ): { questionId: string; form: QuestionnaireFormState } | undefined => {
    for (const form of forms) {
      const response = form.responses.find(
        (r) => r.structured_type === structuredType,
      );
      if (response) {
        return { questionId: response.question_id, form };
      }
    }
    return undefined;
  };

  return (
    <div className="mx-4 mt-8 max-w-4xl">
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <CareIcon
            icon="l-exclamation-circle"
            className="size-5 text-red-500"
          />
          <h3 className="font-medium text-red-700">Validation Errors</h3>
        </div>

        {/* Server-level errors */}
        {serverErrors?.map((error, index) => {
          // Find the structured question if this is a structured data error
          const structuredQuestion = findStructuredQuestionId(
            questionnaireForms,
            error.reference_id,
          );

          return (
            <div
              key={`server-${index}`}
              className="bg-white rounded p-3 border border-red-100 shadow-xs"
            >
              <div className="font-medium text-gray-900 mb-1">
                {getErrorTitle(error)}
              </div>
              <div className="text-sm text-red-600 flex items-start gap-2">
                <CareIcon
                  icon="l-exclamation-circle"
                  className="size-4 mt-0.5 shrink-0"
                />
                <span>{error.message}</span>
              </div>
              {structuredQuestion && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-8 text-xs"
                  onClick={() => {
                    const element = document.getElementById(
                      "question-" + structuredQuestion.questionId,
                    );
                    if (element) {
                      element.scrollIntoView({ block: "center" });
                      element.classList.add(
                        "ring-2",
                        "ring-red-500",
                        "ring-offset-2",
                        "rounded",
                      );
                      setTimeout(() => {
                        element.classList.remove(
                          "ring-2",
                          "ring-red-500",
                          "ring-offset-2",
                          "rounded",
                        );
                      }, 2000);
                    }
                  }}
                >
                  <CareIcon icon="l-arrow-up" className="mr-1 size-3" />
                  {t("scroll_to_question")}
                </Button>
              )}
            </div>
          );
        })}

        {/* Form-level errors */}
        {questionnaireForms.map(
          (form, index) =>
            form.errors.length > 0 && (
              <div
                key={`${form.questionnaire.id}-${index}`}
                className="space-y-3"
              >
                <h3 className="font-medium text-gray-900">
                  {form.questionnaire.title}
                </h3>
                <div className="space-y-3">
                  {form.errors.map((error, errorIndex) => (
                    <div
                      key={errorIndex}
                      className="bg-white rounded p-3 border border-red-100 shadow-xs"
                    >
                      <div className="text-sm text-gray-600 mb-1">
                        {findQuestionText(form, error.question_id)}
                      </div>
                      <div className="text-sm text-red-600 flex items-start gap-2">
                        <CareIcon
                          icon="l-exclamation-circle"
                          className="size-4 mt-0.5 shrink-0"
                        />
                        <span>{error.error}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-8 text-xs"
                        onClick={() => {
                          const element = document.getElementById(
                            "question-" + error.question_id,
                          );
                          if (element) {
                            element.scrollIntoView({ block: "center" });
                            element.classList.add(
                              "ring-2",
                              "ring-red-500",
                              "ring-offset-2",
                              "rounded",
                            );
                            setTimeout(() => {
                              element.classList.remove(
                                "ring-2",
                                "ring-red-500",
                                "ring-offset-2",
                                "rounded",
                              );
                            }, 2000);
                          }
                        }}
                      >
                        <CareIcon icon="l-arrow-up" className="mr-1 size-3" />
                        {t("scroll_to_question")}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ),
        )}
      </div>
    </div>
  );
}

const STRUCTURED_TYPE_VALIDATORS = {
  appointment: (
    response: ResponseValue | undefined,
    questionId: string,
    required?: boolean,
  ) => {
    const appointmentData =
      (response?.value as CreateAppointmentQuestion[]) || [];
    return validateAppointmentQuestion(
      appointmentData[0],
      questionId,
      required ?? false,
    );
  },
  medication_statement: (
    response: ResponseValue | undefined,
    questionId: string,
  ) => {
    const medicationData =
      (response?.value as MedicationStatementRequest[]) || [];
    return validateMedicationStatementQuestion(medicationData, questionId);
  },
  medication_request: (
    response: ResponseValue | undefined,
    questionId: string,
  ) => {
    const medicationData = (response?.value as MedicationRequest[]) || [];
    return validateMedicationRequestQuestion(medicationData, questionId);
  },
  files: (response: ResponseValue | undefined, quesitonId: string) => {
    const files = (response?.value as FileUploadQuestion[]) || [];
    return validateFileUploadQuestion(files, quesitonId);
  },
} as const;

export function QuestionnaireForm({
  questionnaireSlug,
  patientId,
  encounterId,
  subjectType,
  onSubmit,
  onCancel,
  facilityId,
}: QuestionnaireFormProps) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);
  const [questionnaireForms, setQuestionnaireForms] = useState<
    QuestionnaireFormState[]
  >([]);
  const [serverErrors, setServerErrors] = useState<ServerValidationError[]>();
  const [activeQuestionnaireId, setActiveQuestionnaireId] = useState<string>();

  const [activeGroupId, setActiveGroupId] = useState<string>();
  const [isInitialized, setIsInitialized] = useState(false);
  const db = new AppCacheDB();

  const {
    data: questionnaireData,
    isLoading: isQuestionnaireLoading,
    error: questionnaireError,
  } = useQuery({
    queryKey: ["questionnaireDetail", questionnaireSlug],
    queryFn: query(questionnaireApi.detail, {
      pathParams: { id: questionnaireSlug ?? "" },
    }),
    meta: { persist: true },
    networkMode: "online",
    enabled: !!questionnaireSlug && !FIXED_QUESTIONNAIRES[questionnaireSlug],
  });

  const { mutate: submitBatch, isPending } = useMutation({
    mutationFn: mutate(routes.batchRequest, { silent: true }),
    onSuccess: () => {
      setServerErrors(undefined);
      toast.success(t("questionnaire_submitted_successfully"));
      onSubmit?.();
    },
    onError: (error) => {
      const errorData = error.cause as {
        results: Array<{
          reference_id: string;
          status_code: number;
          data:
            | {
                errors?: Array<{
                  question_id?: string;
                  msg?: string;
                  error?: string;
                  type?: string;
                  loc?: string[];
                }>;
              }
            | Array<{
                errors: Array<{
                  type: string;
                  loc: string[];
                  msg: string;
                }>;
              }>;
        }>;
      };

      if (errorData?.results) {
        const results = errorData.results;

        // Only process failed requests (status_code !== 200)
        const failedResults = results.filter(
          (result) => result.status_code !== 200,
        );

        setServerErrors(
          failedResults.map((result) => {
            const reference_id = result.reference_id || "";
            let message = t("validation_failed");

            // Handle array-style structured data errors
            if (Array.isArray(result.data)) {
              const errors = result.data.flatMap((d) => d.errors || []);
              if (errors.length > 0) {
                message = errors
                  .map((e) => {
                    if (e.loc) {
                      return `${e.loc.join(" > ")}: ${e.msg}`;
                    }
                    return e.msg;
                  })
                  .join(", ");
              }
            }
            // Handle regular errors
            else if (result.data?.errors) {
              const firstError = result.data.errors[0];
              if (firstError.loc) {
                message = `${firstError.loc.join(" > ")}: ${firstError.msg}`;
              } else {
                message =
                  firstError.msg || firstError.error || t("validation_failed");
              }
            }

            return {
              reference_id,
              message,
              status_code: result.status_code,
            };
          }),
        );

        // Handle form-level validation errors
        const validationResults = failedResults.filter(
          (r) =>
            !Array.isArray(r.data) &&
            r.data?.errors?.some((e) => e.question_id),
        );

        if (validationResults.length > 0) {
          handleSubmissionError(validationResults as ValidationErrorResponse[]);
        }
      }
      toast.error(t("questionnaire_submission_failed"));
    },
  });

  // TODO: Use useBlocker hook after switching to tanstack router
  // https://tanstack.com/router/latest/docs/framework/react/guide/navigation-blocking#how-do-i-use-navigation-blocking
  useNavigationPrompt(isDirty && !import.meta.env.DEV, t("unsaved_changes"));

  useEffect(() => {
    if (!isInitialized && questionnaireSlug) {
      const questionnaire =
        FIXED_QUESTIONNAIRES[questionnaireSlug] || questionnaireData;

      if (questionnaire) {
        setQuestionnaireForms([
          {
            questionnaire,
            responses: initializeResponses(questionnaire.questions),
            errors: [],
          },
        ]);
        setIsInitialized(true);
      }
    }
  }, [questionnaireData, isInitialized, questionnaireSlug]);

  if (isQuestionnaireLoading) {
    return <Loading />;
  }

  if (questionnaireError) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>{t("questionnaire_error_loading")}</AlertTitle>
        <AlertDescription>{t("questionnaire_not_exist")}</AlertDescription>
      </Alert>
    );
  }

  const initializeResponses = (
    questions: Question[],
  ): QuestionnaireResponse[] => {
    const responses: QuestionnaireResponse[] = [];

    const processQuestion = (q: Question) => {
      if (q.type === "group" && q.questions) {
        q.questions.forEach(processQuestion);
      } else {
        responses.push({
          question_id: q.id,
          link_id: q.link_id,
          values: [],
          structured_type: q.structured_type ?? null,
        });
      }
    };

    questions.forEach(processQuestion);
    return responses;
  };

  const handleSubmissionError = (results: ValidationErrorResponse[]) => {
    const updatedForms = [...questionnaireForms];
    const errorMessages: string[] = [];

    results.forEach((result, index) => {
      const form = updatedForms[index];
      if (!result.data?.errors) {
        return;
      }

      result.data.errors.forEach(
        (error: QuestionValidationError | DetailedValidationError) => {
          // Handle question-specific errors
          if ("question_id" in error) {
            form.errors.push({
              question_id: error.question_id,
              error: error.error ?? error.msg,
            } as QuestionValidationError);
            updatedForms[index] = form;
          }

          // Handle form-level errors
          else if ("loc" in error) {
            const fieldName = error.loc[0];
            errorMessages.push(
              `Error in ${form?.questionnaire?.title}: ${fieldName} - ${error.msg}`,
            );
          }
          // Handle generic errors
          else {
            errorMessages.push(`Error in ${form?.questionnaire?.title}`);
          }
        },
      );
    });

    setQuestionnaireForms(updatedForms);
  };

  const hasErrors = questionnaireForms.some((form) => form.errors.length > 0);

  const assertNever = (x: never): never => {
    throw new Error(`Unhandled structured questionnaire: ${x}`);
  };

  function cleanForCreate<T extends Record<string, any>>(entry: T): T {
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
  const generateAppendOnlyBatchAndQueue = async (
    reference_id: string,
    queryClient: QueryClient,
    authUser: AuthUserModel,
    originalPayload: BatchRequestBody,
    patientID: string,
    encounterID?: string,
  ) => {
    const scopeID = encounterID ?? patientID;
    if (!scopeID) return;
    const parentID = encounterId ? encounterId : patientId;
    const matchingRequests = originalPayload.requests.filter(
      (req) => req.reference_id === reference_id,
    );
    if (matchingRequests.length === 0) return;

    const generatedId = `offline-${reference_id}-${crypto.randomUUID()}`;

    for (const req of matchingRequests) {
      const newOfflineEntry = {
        id: generatedId,
        userId: authUser.external_id,
        mutationSyncRouteKey: OfflineKeyMap.structured_questionnair,
        type: OfflineKeyMap.structured_questionnair,
        resourceType: "Questionnaire",
        payload: {
          requests: [req],
        },
        parentMutationIds: isOfflineId(parentID) ? [parentID] : [],
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

  const generateDiagnosisBatchAndQueue = async (
    queryClient: QueryClient,
    authUser: AuthUserModel,
    originalPayload: BatchRequestBody,
    patientID: string,
    encounterID?: string,
  ) => {
    if (!encounterID) return;
    const parentID = encounterId ? encounterId : patientId;
    const recordId = `offline-${encounterID}-diagnosis`;

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
        userId: authUser.external_id,
        mutationSyncRouteKey: OfflineKeyMap.structured_questionnair,
        type: OfflineKeyMap.structured_questionnair,
        resourceType: "Questionnaire",
        payload: cleanedRequests,
        parentMutationIds: isOfflineId(parentID) ? [parentID] : [],
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
        encounterID,
      );
    } catch (err) {
      console.error("Error saving offline diagnosis", err);
      toast.error(
        t("unexpected_error_while_saving_offline", { item: "diagnosis" }),
      );
    }
  };

  const generateFixedDatapointTypeBatchAndQueue = async (
    reference_id: string,
    queryClient: QueryClient,
    authUser: AuthUserModel,
    originalPayload: BatchRequestBody,
    patientID: string,
    encounterID?: string,
  ) => {
    if (!encounterID) return;
    const isPatientScoped = ["allergy_intolerance"].includes(reference_id);
    const scopeID = isPatientScoped ? patientID : encounterID;
    if (!scopeID) return;
    const parentID = encounterId ? encounterId : patientId;
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
        userId: authUser.external_id,
        mutationSyncRouteKey: OfflineKeyMap.structured_questionnair,
        type: OfflineKeyMap.structured_questionnair,
        resourceType: "Questionnaire",
        payload: cleanedRequests,
        parentMutationIds: isOfflineId(parentID) ? [parentID] : [],
      };

      const saveResult = await saveOfflineWrite(newOfflineEntry);
      if (!saveResult.success) {
        toast.error(
          toast.error(
            t("failed_to_queue_for_offline_submission", {
              reference: reference_id.replace("_", " "),
            }),
          ),
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
            encounterID,
          );
          break;
        case "symptom":
          normalizeAndUpdateSymptom(
            queryClient,
            normalizedRequest,
            authUser,
            patientID,
            encounterID,
          );
          break;
        case "medication_request":
          normalizeAndUpdateMedication_Request(
            queryClient,
            normalizedRequest,
            patientID,
            encounterID,
          );
          break;
        case "medication_statement":
          normalizeAndUpdateMedication_Statement(
            queryClient,
            normalizedRequest,
            authUser,
            patientID,
            encounterID,
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

  const generateEncounterBatchAndQueue = async (
    queryClient: QueryClient,
    authUser: AuthUserModel,
    originalPayload: BatchRequestBody,
    patientID: string,
    encounterID?: string,
  ) => {
    if (!encounterID) return;
    const parentID = encounterId!; // safe to use ! as already return if no encounter ID
    const recordId = `offline-${encounterID}-encounter`;

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
        userId: authUser.external_id,
        mutationSyncRouteKey: OfflineKeyMap.update_encounter_questionnair,
        type: OfflineKeyMap.update_encounter_questionnair,
        resourceType: "Questionnaire",
        payload: cleanedRequests,
        parentMutationIds: isOfflineId(parentID) ? [parentID] : [],
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
        encounterID,
      );
    } catch (err) {
      console.error("Error saving offline encounter questionnaire", err);
      toast.error(
        t("unexpected_error_while_saving_offline", { item: "encounter" }),
      );
    }
  };

  const queueQuestionnairBatchrequest = async (
    questionnairPaylod: BatchRequestBody,
  ) => {
    const parentID = encounterId ? encounterId : patientId;

    try {
      const structuredQuestionnaires = questionnairPaylod.requests.filter(
        (
          q,
        ): q is (typeof questionnairPaylod.requests)[number] & {
          reference_id: StructuredQuestionnaireReferenceId;
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
            );
            break;

          case "diagnosis":
            await generateDiagnosisBatchAndQueue(
              queryClient,
              authUser,
              questionnairPaylod,
              patientId,
              encounterId,
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
            );
            break;

          case "allergy_intolerance":
          case "medication_request":
          case "symptom":
          case "medication_statement":
          case "charge_item":
          case "service_request":
            await generateFixedDatapointTypeBatchAndQueue(
              fixedQ.reference_id,
              queryClient,
              authUser,
              questionnairPaylod,
              patientId,
              encounterId,
            );
            break;

          default:
            assertNever(fixedQ.reference_id);
          /* if compile error is : Argument of type 'any' is not assignable to parameter of type 'never'
            then you have not handle all the strucured Questionnair properly either added new one or removed
            It help us to sync offline code path whenver something change  in questionnair that affect offline func
            **/
        }
      }

      if (nonStructuredQuestionnaires.length <= 0) {
        setServerErrors(undefined);
        toast.success(t("questionnaire_submitted_successfully"));
        onSubmit?.();
        return;
      }
      // saved non fixed question types
      const generatedId = `offline-${crypto.randomUUID()}`;

      const offlineEntry = {
        id: generatedId,
        userId: authUser.external_id,
        mutationSyncRouteKey: OfflineKeyMap.non_structured_questionnaire,
        type: OfflineKeyMap.non_structured_questionnaire,
        resourceType: "Questionnaire",
        payload: { requests: nonStructuredQuestionnaires },
        parentMutationIds: isOfflineId(parentID) ? [parentID] : [],
      };

      const saveResult = await saveOfflineWrite(offlineEntry);
      if (!saveResult.success) {
        toast.error(t("unable_to_queue_non_structured_questions"));
      }
      //  Handle caching & updating UI for non-fixed questionnaires
      cacheQuestionnairResponse(
        queryClient,
        { requests: nonStructuredQuestionnaires },
        authUser,
        patientId,
        encounterId,
        subjectType,
      );

      setServerErrors(undefined);
      toast.success(t("questionnaire_submitted_successfully"));
      onSubmit?.();
    } catch (error) {
      console.error("Error while submit Questionnaire", error);
      toast.error(
        t("unexpected_error_while_saving_offline", { item: "questionnair" }),
      );
    }
  };

  const handleSubmit = async () => {
    setIsDirty(false);

    // Clear existing errors first
    const formsWithClearedErrors = questionnaireForms.map((form) => ({
      ...form,
      errors: [],
    }));
    let firstErrorId: string | undefined = undefined;

    // Validate all required fields
    const formsWithValidation = formsWithClearedErrors.map((form) => {
      const errors: QuestionValidationError[] = [];
      const validateQuestion = (q: Question) => {
        // Handle nested questions in groups
        if (q.type === "group" && q.questions) {
          q.questions.forEach(validateQuestion);
          return;
        }

        if (q.required) {
          // Handle appointment validation
          const response = form.responses.find((r) => r.question_id === q.id);
          const hasValue = response?.values?.some(
            (v) =>
              v.value !== undefined &&
              v.value !== null &&
              v.value !== "" &&
              (Array.isArray(v.value) ? v.value.length > 0 : true),
          );

          const hasProperty = (arr: any[] | undefined, prop: string) =>
            Array.isArray(arr) && arr.some((item) => item?.[prop] != null);

          const hasCoding = hasProperty(response?.values, "coding");
          const hasUnit = hasProperty(response?.values, "unit");

          if (!hasValue && !hasCoding && !hasUnit) {
            errors.push({
              question_id: q.id,
              error: t("field_required"),
              type: "validation_error",
              msg: t("field_required"),
            });
            firstErrorId = firstErrorId ? firstErrorId : q.id;
          }
        }

        if (q.type === "structured" && q.structured_type) {
          const response = form.responses.find((r) => r.question_id === q.id);
          const validator =
            STRUCTURED_TYPE_VALIDATORS[
              q.structured_type as keyof typeof STRUCTURED_TYPE_VALIDATORS
            ];

          if (validator) {
            let validationErrors: QuestionValidationError[] = [];
            validationErrors = validator(
              response?.values?.[0],
              q.id,
              q.required,
            );
            errors.push(...validationErrors);
            if (validationErrors.length > 0) {
              firstErrorId = firstErrorId ? firstErrorId : q.id;
            }
          }
        }
      };

      form.questionnaire.questions.forEach(validateQuestion);
      return { ...form, errors };
    });

    setQuestionnaireForms(formsWithValidation);

    if (firstErrorId) {
      setTimeout(() => {
        const element = document.getElementById("question-" + firstErrorId);
        element?.scrollIntoView({ block: "center" });
      });
      return;
    }

    // Continue with existing submission logic...
    const requests: FormBatchRequest[] = [];
    if (patientId) {
      const context = { facilityId, patientId, encounterId };
      const structuredPromises: Promise<FormBatchRequest[]>[] = [];

      formsWithValidation.forEach((form) => {
        form.responses.forEach((response) => {
          if (response.structured_type) {
            const structuredData = response.values?.[0]?.value;
            if (Array.isArray(structuredData) && structuredData.length > 0) {
              structuredPromises.push(
                getStructuredRequests(
                  response.structured_type,
                  structuredData,
                  context,
                ),
              );
            }
          }
        });
      });

      const structuredRequestsArrays = await Promise.all(structuredPromises);

      structuredRequestsArrays.forEach((requestArray) => {
        requests.push(...requestArray);
      });
    }

    // Then, add questionnaire submission requests
    formsWithValidation.forEach((form) => {
      const validResponses = form.responses.filter(
        (response) =>
          !response.structured_type &&
          response.values.length > 0 &&
          response.values?.[0]?.value !== "",
      );
      if (validResponses.length > 0) {
        requests.push({
          url: `/api/v1/questionnaire/${form.questionnaire.slug}/submit/`,
          method: "POST",
          reference_id: form.questionnaire.id,
          body: {
            resource_id: encounterId ? encounterId : patientId,
            encounter: encounterId,
            patient: patientId,
            results: validResponses
              .filter((response) =>
                isQuestionEnabled(
                  findQuestionById(
                    form.questionnaire.questions,
                    response.question_id,
                  ) as Question,
                  form.responses,
                ),
              )
              .map((response) => ({
                question_id: response.question_id,
                values: response.values.map((value) => {
                  if (value.type === "date" && value.value) {
                    const date = new Date(value.value);
                    if (isNaN(date.getTime())) {
                      return { ...value, value: "" };
                    }
                    const formattedDate = dateQueryString(date);
                    return {
                      ...value,
                      value: formattedDate,
                    };
                  } else if (value.type === "dateTime" && value.value) {
                    return {
                      ...value,
                      value: value.value.toISOString(),
                    };
                  }
                  if (value.unit) {
                    return {
                      value: value.value?.toString(),
                      unit: value.unit,
                      coding: value.coding,
                    };
                  }
                  if (value.coding) {
                    return { coding: value.coding };
                  }
                  return { value: String(value.value) };
                }),
                note: response.note,
                body_site: response.body_site,
                method: response.method,
              })),
          },
        });
      }
    });

    if (!onlineManager.isOnline()) {
      const questionnairPaylod = { requests };
      await queueQuestionnairBatchrequest(questionnairPaylod);
      return;
    }

    submitBatch({ requests });
  };

  const scrollToQuestion = (questionnaireId: string, groupId?: string) => {
    setActiveQuestionnaireId(questionnaireId);
    setActiveGroupId(groupId);

    let element: Element | null;

    if (groupId) {
      element = document.querySelector(`[data-group-id="${groupId}"]`);
    } else {
      element = document.querySelector(
        `[data-questionnaire-id="${questionnaireId}"]`,
      );
    }

    if (element) {
      element.scrollIntoView({ block: "start" });
    }
  };

  return (
    <div className="flex gap-4">
      {/* Left Navigation */}
      <div className="w-64 border-r border-gray-200 p-4 space-y-4 overflow-y-auto sticky top-6 h-screen lg:block hidden">
        {questionnaireForms.map((form) => (
          <div key={form.questionnaire.id} className="space-y-2">
            <button
              className={cn(
                "w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium",
                activeQuestionnaireId === form.questionnaire.id &&
                  "bg-gray-100 text-green-600",
              )}
              onClick={() => scrollToQuestion(form.questionnaire.id)}
              disabled={isPending}
            >
              {form.questionnaire.title}
            </button>
            <div className="pl-4 space-y-1">
              {form.questionnaire.questions
                .filter((q) => q.type === "group")
                .map((group) => (
                  <button
                    key={group.id}
                    className={cn(
                      "w-full text-left px-2 py-1 rounded text-sm hover:bg-gray-100",
                      activeGroupId === group.id &&
                        "bg-gray-100 text-green-600",
                    )}
                    onClick={() =>
                      scrollToQuestion(form.questionnaire.id, group.id)
                    }
                    disabled={isPending}
                  >
                    {group.text}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto w-full pb-8 space-y-2">
        {/* Questionnaire Forms */}
        {questionnaireForms.map((form, index) => (
          <div
            key={`${form.questionnaire.id}-${index}`}
            className="rounded-lg py-6 space-y-6"
            data-questionnaire-id={form.questionnaire.id}
          >
            <div className="flex justify-between items-center max-w-4xl p-2">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold">
                  {form.questionnaire.title}
                </h2>
                {form.questionnaire.description && (
                  <p className="text-sm text-gray-500">
                    {form.questionnaire.description}
                  </p>
                )}
              </div>
              {form.questionnaire.slug !== questionnaireSlug && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuestionnaireForms((prev) =>
                      prev.filter(
                        (f) => f.questionnaire.id !== form.questionnaire.id,
                      ),
                    );
                  }}
                  disabled={isPending}
                >
                  <CareIcon icon="l-times-circle" />
                  <span>Remove</span>
                </Button>
              )}
            </div>

            <QuestionRenderer
              facilityId={facilityId}
              encounterId={encounterId}
              questions={form.questionnaire.questions}
              responses={form.responses}
              onResponseChange={(
                values: ResponseValue[],
                questionId: string,
                note?: string,
              ) => {
                setQuestionnaireForms((existingForms) =>
                  existingForms.map((formItem) =>
                    formItem.questionnaire.id === form.questionnaire.id
                      ? {
                          ...formItem,
                          responses: formItem.responses.map((r) =>
                            r.question_id === questionId
                              ? { ...r, values, note: note }
                              : r,
                          ),
                          errors: [],
                        }
                      : formItem,
                  ),
                );
                if (!isDirty) {
                  setIsDirty(true);
                }
              }}
              disabled={isPending}
              activeGroupId={activeGroupId}
              errors={form.errors}
              patientId={patientId}
              clearError={(questionId: string) => {
                setQuestionnaireForms((prev) =>
                  prev.map((f) =>
                    f.questionnaire.id === form.questionnaire.id
                      ? {
                          ...f,
                          errors: f.errors.filter(
                            (e) => e.question_id !== questionId,
                          ),
                        }
                      : f,
                  ),
                );
              }}
            />
          </div>
        ))}

        {/* Search and Add Questionnaire */}

        {encounterId !== "preview" && (
          <>
            <div
              key={`${questionnaireForms.length}`}
              className="flex gap-4 items-center max-w-4xl px-2"
            >
              <QuestionnaireSearch
                subjectType={subjectType}
                onSelect={(selected) => {
                  if (
                    questionnaireForms.some(
                      (form) => form.questionnaire.id === selected.id,
                    )
                  ) {
                    return;
                  }

                  setQuestionnaireForms((prev) => [
                    ...prev,
                    {
                      questionnaire: selected,
                      responses: initializeResponses(selected.questions),
                      errors: [],
                    },
                  ]);
                }}
                disabled={isPending}
              />
            </div>

            {/* Submit and Cancel Buttons */}
            {questionnaireForms.length > 0 && (
              <div className="flex justify-end gap-4 mx-4 mt-4 max-w-4xl">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isPending}
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isPending || hasErrors}
                  className="relative"
                >
                  {isPending ? (
                    <>
                      <span className="opacity-0">{t("submit")}</span>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="size-5 animate-spin rounded-full border-b-2 border-white" />
                      </div>
                    </>
                  ) : (
                    t("submit")
                  )}
                </Button>
              </div>
            )}

            <ValidationErrorDisplay
              questionnaireForms={questionnaireForms}
              serverErrors={serverErrors}
            />
          </>
        )}

        <PLUGIN_Component
          __name="Scribe"
          formState={questionnaireForms}
          setFormState={setQuestionnaireForms}
        />

        <DebugPreview
          data={questionnaireForms}
          title="QuestionnaireForm"
          className="p-4 space-y-6 max-w-4xl m-2"
        />
      </div>
    </div>
  );
}

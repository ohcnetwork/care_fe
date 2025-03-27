import { useMutation, useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useNavigationPrompt } from "raviger";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { DebugPreview } from "@/components/Common/DebugPreview";
import Loading from "@/components/Common/Loading";

import { PLUGIN_Component } from "@/PluginEngine";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { MedicationRequest } from "@/types/emr/medicationRequest";
import { MedicationStatementRequest } from "@/types/emr/medicationStatement";
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
import type { Question } from "@/types/questionnaire/question";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import { CreateAppointmentQuestion } from "@/types/scheduling/schedule";

import { QuestionRenderer } from "./QuestionRenderer";
import { validateAppointmentQuestion } from "./QuestionTypes/AppointmentQuestion";
import { validateFileUploadQuestion } from "./QuestionTypes/FileQuestion";
import { validateMedicationRequestQuestion } from "./QuestionTypes/MedicationRequestQuestion";
import { validateMedicationStatementQuestion } from "./QuestionTypes/MedicationStatementQuestion";
import { QuestionnaireSearch } from "./QuestionnaireSearch";
import { FIXED_QUESTIONNAIRES } from "./data/StructuredFormData";
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
                    const element = document.querySelector(
                      `[data-question-id="${structuredQuestion.questionId}"]`,
                    );
                    if (element) {
                      element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
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
                          const element = document.querySelector(
                            `[data-question-id="${error.question_id}"]`,
                          );
                          if (element) {
                            element.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
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
  appointment: (response: ResponseValue | undefined, questionId: string) => {
    const appointmentData =
      (response?.value as CreateAppointmentQuestion[]) || [];
    return validateAppointmentQuestion(appointmentData[0], questionId);
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
  const [isDirty, setIsDirty] = useState(false);
  const [questionnaireForms, setQuestionnaireForms] = useState<
    QuestionnaireFormState[]
  >([]);
  const [serverErrors, setServerErrors] = useState<ServerValidationError[]>();
  const [activeQuestionnaireId, setActiveQuestionnaireId] = useState<string>();

  const [activeGroupId, setActiveGroupId] = useState<string>();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    data: questionnaireData,
    isLoading: isQuestionnaireLoading,
    error: questionnaireError,
  } = useQuery({
    queryKey: ["questionnaireDetail", questionnaireSlug],
    queryFn: query(questionnaireApi.detail, {
      pathParams: { id: questionnaireSlug ?? "" },
    }),
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
            const validationErrors = validator(response?.values?.[0], q.id);
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
        const element = document.querySelector(
          `[data-question-id="${firstErrorId}"]`,
        );
        element?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    // Continue with existing submission logic...
    const requests: FormBatchRequest[] = [];
    if (encounterId && patientId) {
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
      const nonStructuredResponses = form.responses.filter(
        (response) => !response.structured_type,
      );

      if (nonStructuredResponses.length > 0) {
        requests.push({
          url: `/api/v1/questionnaire/${form.questionnaire.slug}/submit/`,
          method: "POST",
          reference_id: form.questionnaire.id,
          body: {
            resource_id: encounterId ? encounterId : patientId,
            encounter: encounterId,
            patient: patientId,
            results: nonStructuredResponses
              .filter(
                (response) =>
                  response.values.length > 0 && !response.structured_type,
              )
              .map((response) => ({
                question_id: response.question_id,
                values: response.values.map((value) => {
                  if (value.type === "dateTime" && value.value) {
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
      element.scrollIntoView({ behavior: "smooth", block: "start" });
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
              className="flex gap-4 items-center m-4 max-w-4xl"
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

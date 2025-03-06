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

import { QuestionRenderer } from "./QuestionRenderer";
import { QuestionnaireSearch } from "./QuestionnaireSearch";
import { FIXED_QUESTIONNAIRES } from "./data/StructuredFormData";
import { getStructuredRequests } from "./structured/handlers";

export interface QuestionnaireFormState {
  questionnaire: QuestionnaireDetail;
  responses: QuestionnaireResponse[];
  errors: QuestionValidationError[];
}

interface BatchRequest {
  url: string;
  method: string;
  body: Record<string, any>;
  reference_id: string;
}

export interface QuestionnaireFormProps {
  questionnaireSlug?: string;
  patientId: string;
  encounterId?: string;
  subjectType?: string;
  onSubmit?: () => void;
  onCancel?: () => void;
  facilityId: string;
}

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
      toast.success(t("questionnaire_submitted_successfully"));
      onSubmit?.();
    },
    onError: (error) => {
      const errorData = error.cause;
      if (errorData?.results) {
        handleSubmissionError(errorData.results as ValidationErrorResponse[]);
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
          const response = form.responses.find((r) => r.question_id === q.id);
          const hasValue = response?.values?.some(
            (v) => v.value !== undefined && v.value !== null && v.value !== "",
          );

          if (!hasValue) {
            errors.push({
              question_id: q.id,
              error: t("field_required"),
              type: "validation_error",
              msg: t("field_required"),
            });
            firstErrorId = firstErrorId ? firstErrorId : q.id;
          }
        }
      };

      form.questionnaire.questions.forEach(validateQuestion);
      return { ...form, errors };
    });

    setQuestionnaireForms(formsWithValidation);

    if (firstErrorId) {
      const element = document.querySelector(
        `[data-question-id="${firstErrorId}"]`,
      );
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    if (formsWithValidation.some((form) => form.errors.length > 0)) {
      return;
    }

    // Continue with existing submission logic...
    const requests: BatchRequest[] = [];
    if (encounterId && patientId) {
      const context = { facilityId, patientId, encounterId };
      // First, collect all structured data requests if encounterId is provided
      formsWithValidation.forEach((form) => {
        form.responses.forEach((response) => {
          if (response.structured_type) {
            const structuredData = response.values?.[0]?.value;
            if (Array.isArray(structuredData) && structuredData.length > 0) {
              const structuredRequests = getStructuredRequests(
                response.structured_type,
                structuredData,
                context,
              );
              requests.push(...structuredRequests);
            }
          }
        });
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
            resource_id: encounterId,
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
                  if (value.value_code) {
                    return { value_code: value.value_code };
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

  return (
    <div className="flex gap-4">
      {/* Left Navigation */}
      <div className="w-64 border-r p-4 space-y-4 overflow-y-auto sticky top-6 h-screen lg:block hidden">
        {questionnaireForms.map((form) => (
          <div key={form.questionnaire.id} className="space-y-2">
            <button
              className={cn(
                "w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium",
                activeQuestionnaireId === form.questionnaire.id &&
                  "bg-gray-100 text-green-600",
              )}
              onClick={() => setActiveQuestionnaireId(form.questionnaire.id)}
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
                    onClick={() => {
                      setActiveQuestionnaireId(form.questionnaire.id);
                      setActiveGroupId(group.id);
                    }}
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
            className="rounded-lg py-6 px-4 space-y-6"
          >
            <div className="flex justify-between items-center max-w-4xl">
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

              {form.questionnaire.id !== questionnaireData?.id && (
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
                        <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                      </div>
                    </>
                  ) : (
                    t("submit")
                  )}
                </Button>
              </div>
            )}
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

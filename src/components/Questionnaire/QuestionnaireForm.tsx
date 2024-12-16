import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import Loading from "@/components/Common/Loading";

import { Error, Success } from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import useMutation from "@/Utils/request/useMutation";
import useQuery from "@/Utils/request/useQuery";
import {
  DetailedValidationError,
  QuestionValidationError,
  ValidationErrorResponse,
} from "@/types/questionnaire/batch";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";

import { QuestionRenderer } from "./QuestionRenderer";
import { QuestionnaireSearch } from "./QuestionnaireSearch";
import { getStructuredRequests } from "./structured/handlers";

interface QuestionnaireFormState {
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
  resourceId: string;
  encounterId: string;
  onSubmit?: () => void;
  onCancel?: () => void;
}

export function QuestionnaireForm({
  questionnaireSlug,
  resourceId,
  encounterId,
  onSubmit,
  onCancel,
}: QuestionnaireFormProps) {
  const [questionnaireForms, setQuestionnaireForms] = useState<
    QuestionnaireFormState[]
  >([]);
  const [activeQuestionnaireId, setActiveQuestionnaireId] = useState<string>();
  const [activeGroupId, setActiveGroupId] = useState<string>();
  const [isInitialized, setIsInitialized] = useState(false);

  const {
    data: questionnaireData,
    loading: isQuestionnaireLoading,
    error: questionnaireError,
  } = useQuery(routes.questionnaire.detail, {
    pathParams: { id: questionnaireSlug ?? "" },
    prefetch: !!questionnaireSlug,
  });

  const { mutate: submitBatch, isProcessing } = useMutation(
    routes.batchRequest,
    { silent: true },
  );

  useEffect(() => {
    if (questionnaireData && !isInitialized) {
      setQuestionnaireForms([
        {
          questionnaire: questionnaireData,
          responses: initializeResponses(questionnaireData.questions),
          errors: [],
        },
      ]);
      setIsInitialized(true);
    }
  }, [questionnaireData, isInitialized]);

  if (isQuestionnaireLoading) {
    return <Loading />;
  }

  if (questionnaireError) {
    console.log(questionnaireError);
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>Error loading questionnaire</AlertTitle>
        <AlertDescription>
          The questionnaire you tried to access does not exist.
        </AlertDescription>
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
    if (hasErrors) return;

    const requests: BatchRequest[] = [];
    const context = { resourceId, encounterId };

    // First, collect all structured data requests
    questionnaireForms.forEach((form) => {
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

    // Then, add questionnaire submission requests
    questionnaireForms.forEach((form) => {
      const nonStructuredResponses = form.responses.filter((response) => {
        const question = form.questionnaire.questions.find(
          (q) => q.id === response.question_id,
        );
        return !question?.structured_type;
      });

      if (nonStructuredResponses.length > 0) {
        requests.push({
          url: `/api/v1/questionnaire/${form.questionnaire.slug}/submit/`,
          method: "POST",
          reference_id: form.questionnaire.id,
          body: {
            resource_id: resourceId,
            encounter: encounterId,
            results: nonStructuredResponses
              .filter(
                (response) =>
                  response.values.length > 0 && !response.structured_type,
              )
              .map((response) => ({
                question_id: response.question_id,
                values: response.values.map((value) => ({
                  ...(value.value_code
                    ? { value_code: value.value_code }
                    : { value: String(value.value || "") }),
                })),
                note: response.note,
                body_site: response.body_site,
                method: response.method,
              })),
          },
        });
      }
    });

    const response = await submitBatch({
      body: { requests },
    });

    if (!response.data) {
      if (response.error) {
        handleSubmissionError(
          response.error.results as ValidationErrorResponse[],
        );
        Error({ msg: "Failed to submit questionnaire" });
      }
      return;
    }

    Success({ msg: "Questionnaire submitted successfully" });
    onSubmit?.();
  };

  return (
    <div className="flex gap-4">
      {/* Left Navigation */}
      <div className="w-64 border-r p-4 space-y-4 overflow-y-auto sticky top-6 h-screen">
        {questionnaireForms.map((form) => (
          <div key={form.questionnaire.id} className="space-y-2">
            <button
              className={cn(
                "w-full text-left px-2 py-1 rounded hover:bg-gray-100 font-medium",
                activeQuestionnaireId === form.questionnaire.id &&
                  "bg-gray-100 text-green-600",
              )}
              onClick={() => setActiveQuestionnaireId(form.questionnaire.id)}
              disabled={isProcessing}
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
                    disabled={isProcessing}
                  >
                    {group.text}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto max-w-3xl pb-8">
        <div className="p-4 space-y-6">
          {/* Search and Add Questionnaire */}

          <div className="flex gap-4 items-center">
            <QuestionnaireSearch
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
              disabled={isProcessing}
            />
          </div>

          {/* Questionnaire Forms */}
          {questionnaireForms.map((form, index) => (
            <div
              key={`${form.questionnaire.id}-${index}`}
              className="border rounded-lg p-6 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold">
                    {form.questionnaire.title}
                  </h2>
                  {form.questionnaire.description && (
                    <p className="text-sm text-muted-foreground">
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
                    disabled={isProcessing}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <QuestionRenderer
                questions={form.questionnaire.questions}
                responses={form.responses}
                onResponseChange={(responses) => {
                  setQuestionnaireForms((existingForms) =>
                    existingForms.map((formItem) =>
                      formItem.questionnaire.id === form.questionnaire.id
                        ? { ...formItem, responses }
                        : formItem,
                    ),
                  );
                }}
                disabled={isProcessing}
                activeGroupId={activeGroupId}
                errors={form.errors}
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

          {/* Submit and Cancel Buttons */}
          {questionnaireForms.length > 0 && (
            <div className="flex justify-end gap-4 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={isProcessing || hasErrors}
                className="relative"
              >
                {isProcessing ? (
                  <>
                    <span className="opacity-0">Submit</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
                    </div>
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          )}
        </div>
        {/* Add a Preview of the QuestionnaireForm */}
        <div className="p-4 space-y-6">
          <h2 className="text-xl font-semibold">QuestionnaireForm</h2>
          <pre className="text-sm text-muted-foreground">
            {JSON.stringify(questionnaireForms, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

import { useStore } from "jotai";
import { Suspense, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";

import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";
import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import { initializeStructuredResponse } from "@/components/QuestionnaireV2/fill/draft/structuredDraft";
import {
  getResponsesAtPath,
  useResponseScope,
} from "@/components/QuestionnaireV2/form/engine/responseScope";
import {
  responsesAtom,
  useClearQuestionErrors,
  useClearStructuredRenderFailed,
  useMarkStructuredRenderFailed,
  useQuestionErrors,
  useQuestionResponse,
} from "@/components/QuestionnaireV2/form/engine/store";

import {
  resolveStructuredSlotState,
  structuredTypeLabel,
} from "@/components/QuestionnaireV2/structured/registry";

import type { ResponseValue } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { useFormRenderer } from "./FormContext";

// Rendered inside the boundary beside the component: if the component
// throws while mounting, this probe is discarded with it, so the clear
// only fires for a commit whose input actually reached the screen.
function ClearRenderFailedOnMount({ questionId }: { questionId: string }) {
  const clearRenderFailed = useClearStructuredRenderFailed(questionId);
  useEffect(() => {
    clearRenderFailed();
  }, [clearRenderFailed]);
  return null;
}

/** Renders core and plugin structured questions from a resolved definition. */
export function StructuredSlot({
  question,
  disabled,
}: {
  question: Question;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const { mode, subject, questionnaire } = useFormRenderer();
  const path = useResponseScope();
  const [response, updateResponse] = useQuestionResponse(question.id);
  const store = useStore();
  const errors = useQuestionErrors(question.id);
  const clearErrors = useClearQuestionErrors(question.id);
  const markRenderFailed = useMarkStructuredRenderFailed(question.id);

  const handleChange = useCallback(
    (values: ResponseValue[], note?: string) =>
      updateResponse(note === undefined ? { values } : { values, note }),
    [updateResponse],
  );
  const handleInitializeResponse = useCallback(
    (values: ResponseValue[]) => {
      const current = getResponsesAtPath(store.get(responsesAtom), path)[
        question.id
      ];
      if (current)
        updateResponse(initializeStructuredResponse(current, values));
    },
    [question.id, path, store, updateResponse],
  );

  const state = question.structured_type
    ? resolveStructuredSlotState(
        question.structured_type,
        questionnaire.subject_type,
        subject,
      )
    : undefined;

  if (state?.kind === "unknown_type") {
    return (
      <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        {t(
          question.required
            ? "structured_type_plugin_missing_required"
            : "structured_type_plugin_missing",
          { type: question.structured_type },
        )}
      </div>
    );
  }
  if (!state || !response) return null;

  const { definition } = state;
  const label = structuredTypeLabel(definition.type, t);

  if (state.kind === "subject_mismatch") {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
        {t(
          question.required
            ? "structured_type_subject_mismatch_required"
            : "structured_type_subject_mismatch",
          { type: label, subject: t(questionnaire.subject_type) },
        )}
      </div>
    );
  }

  if (state.kind === "missing_context") {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700">{label}</p>
        <p>
          {t(
            question.required
              ? "structured_question_requires_context_required"
              : "structured_question_requires_context",
            {
              contexts: state.missing
                .map((key) => t(`context__${key}`))
                .join(", "),
            },
          )}
        </p>
      </div>
    );
  }

  const Component = definition.component;
  return (
    <PluginErrorBoundary
      pluginName={definition.type}
      onError={markRenderFailed}
      resetKey={definition}
      fallback={
        <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">{label}</p>
          <p>
            {t(
              question.required
                ? "structured_question_render_failed_required"
                : "structured_question_render_failed",
            )}
          </p>
        </div>
      }
    >
      <ClearRenderFailedOnMount questionId={question.id} />
      <Suspense fallback={<FormSkeleton rows={2} />}>
        <Component
          question={question}
          response={response}
          onChange={handleChange}
          onInitializeResponse={handleInitializeResponse}
          disabled={disabled}
          errors={errors}
          clearError={clearErrors}
          patientId={subject.patientId}
          encounterId={subject.encounterId}
          facilityId={subject.facilityId}
          {...(mode === "fill"
            ? {
                questionnaireId: questionnaire.id,
                questionnaireSlug: questionnaire.slug,
              }
            : {})}
        />
      </Suspense>
    </PluginErrorBoundary>
  );
}

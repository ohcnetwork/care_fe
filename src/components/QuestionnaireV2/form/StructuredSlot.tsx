import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  useQuestionErrors,
  useQuestionResponse,
} from "@/components/QuestionnaireV2/renderer/store";
import { STRUCTURED_REGISTRY } from "@/components/QuestionnaireV2/renderer/structured/registry";

import type { ResponseValue } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { useFormRenderer } from "./FormContext";

/**
 * Structured questions reuse the legacy QuestionTypes UI through
 * STRUCTURED_REGISTRY (the module's one sanctioned `any`). Differences from
 * the old slot, both fill-path fixes:
 * - `updateQuestionnaireResponseCB` is memoized — ChargeItemQuestion lists
 *   it in an effect dependency array, so a fresh inline arrow per render is
 *   a real loop hazard.
 * - fill mode passes `questionnaireId`/`questionnaireSlug` so
 *   MedicationRequest/ServiceRequest response-template sheets work; preview
 *   deliberately withholds them, keeping template CRUD (real POSTs) off the
 *   builder surface.
 */
export function StructuredSlot({
  question,
  disabled,
}: {
  question: Question;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const { mode, subject, questionnaire } = useFormRenderer();
  const [response, updateResponse] = useQuestionResponse(question.id);
  const errors = useQuestionErrors(question.id);

  const handleUpdate = useCallback(
    (values: ResponseValue[], _questionId: string, note?: string) =>
      updateResponse({ values, note }),
    [updateResponse],
  );

  const entry = question.structured_type
    ? STRUCTURED_REGISTRY[question.structured_type]
    : undefined;
  if (!entry || !response) return null;

  const missing = entry.requires.filter((key) => !subject[key]);
  if (missing.length > 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
        <p className="font-medium text-gray-700">
          {t(`structured_type__${question.structured_type}`)}
        </p>
        <p>
          {t("structured_question_requires_context", {
            contexts: missing.map((key) => t(`context__${key}`)).join(", "),
          })}
        </p>
      </div>
    );
  }

  const Component = entry.component;
  return (
    <Component
      question={question}
      questionnaireResponse={response}
      updateQuestionnaireResponseCB={handleUpdate}
      disabled={disabled}
      errors={errors}
      clearError={() => {}}
      index={0}
      withLabel={false}
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
  );
}

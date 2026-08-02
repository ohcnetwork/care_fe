import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import {
  useQuestionErrors,
  useQuestionResponse,
} from "@/components/QuestionnaireV2/renderer/store";
import { structuredDefinitionFor } from "@/components/QuestionnaireV2/structured/registry";

import type { ResponseValue } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { useFormRenderer } from "./FormContext";

/**
 * Structured questions render through STRUCTURED_TYPE_REGISTRY — one
 * definition per type carrying the (legacy-adapted) component and its
 * context requirements. Fill-path specifics:
 * - `onChange` is memoized — adapters keep their derived callbacks stable
 *   on top of it (ChargeItemQuestion lists the callback in an effect
 *   dependency array, so a fresh arrow per render is a real loop hazard).
 * - fill mode passes `questionnaireId`/`questionnaireSlug` so
 *   MedicationRequest/ServiceRequest response-template sheets work;
 *   preview deliberately withholds them, keeping template CRUD (real
 *   POSTs) off the builder surface.
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

  const handleChange = useCallback(
    (values: ResponseValue[], note?: string) =>
      updateResponse({ values, note }),
    [updateResponse],
  );

  const definition = question.structured_type
    ? structuredDefinitionFor(question.structured_type)
    : undefined;
  if (!definition || !response) return null;

  const missing = definition.requires.filter((key) => !subject[key]);
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

  const Component = definition.component;
  return (
    <Component
      question={question}
      response={response}
      onChange={handleChange}
      disabled={disabled}
      errors={errors}
      clearError={() => {}}
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

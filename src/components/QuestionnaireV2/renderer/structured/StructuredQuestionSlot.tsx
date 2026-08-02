import { useTranslation } from "react-i18next";

import { useRenderer } from "@/components/QuestionnaireV2/renderer/RendererContext";
import {
  useQuestionErrors,
  useQuestionResponse,
} from "@/components/QuestionnaireV2/renderer/store";
import { STRUCTURED_REGISTRY } from "@/components/QuestionnaireV2/renderer/structured/registry";

import type { ResponseValue } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import { isCoreStructuredType } from "@/types/questionnaire/structured";

export function StructuredQuestionSlot({
  question,
  disabled,
}: {
  question: Question;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const { subject } = useRenderer();
  const [response, updateResponse] = useQuestionResponse(question.id);
  const errors = useQuestionErrors(question.id);

  // This paginated shell predates the plugin registry (form/StructuredSlot
  // is the live path) — it only ever renders core types.
  const entry =
    question.structured_type && isCoreStructuredType(question.structured_type)
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
      updateQuestionnaireResponseCB={(
        values: ResponseValue[],
        _questionId: string,
        note?: string,
      ) => updateResponse({ values, note })}
      disabled={disabled}
      errors={errors}
      clearError={() => {}}
      index={0}
      withLabel={false}
      patientId={subject.patientId}
      encounterId={subject.encounterId}
      facilityId={subject.facilityId}
    />
  );
}

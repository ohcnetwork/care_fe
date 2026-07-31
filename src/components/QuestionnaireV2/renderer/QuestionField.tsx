import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { NoteAffordance } from "@/components/QuestionnaireV2/renderer/NoteAffordance";
import { QuestionGroupCard } from "@/components/QuestionnaireV2/renderer/QuestionGroupCard";
import { useRenderer } from "@/components/QuestionnaireV2/renderer/RendererContext";
import { QUESTION_TYPE_COMPONENTS } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { sanitizeStylingClasses } from "@/components/QuestionnaireV2/renderer/sanitizeStylingClasses";
import {
  useQuestionEnabled,
  useQuestionErrors,
} from "@/components/QuestionnaireV2/renderer/store";
import { StructuredQuestionSlot } from "@/components/QuestionnaireV2/renderer/structured/StructuredQuestionSlot";

import type { Question } from "@/types/questionnaire/question";

export function QuestionField({
  question,
  depth,
}: {
  question: Question;
  depth: number;
}) {
  const { t } = useTranslation();
  const { mode } = useRenderer();
  const enabled = useQuestionEnabled(question);
  const errors = useQuestionErrors(question.id);
  const disabled = mode === "readonly" || question.read_only === true;

  if (!enabled && question.disabled_display !== "protected") return null;
  const effectiveDisabled = disabled || !enabled;

  if (question.type === "group") {
    return (
      <QuestionGroupCard
        question={question}
        depth={depth}
        disabled={effectiveDisabled}
      />
    );
  }

  const InputComponent = QUESTION_TYPE_COMPONENTS[question.type];
  // Programmatic label association: text-like inputs take `id={inputId}` for
  // the htmlFor pairing; chip groups (boolean/choice) reference `labelId`
  // via aria-labelledby on their radiogroup container instead.
  const inputId = `question-input-${question.id}`;
  const labelId = `question-label-${question.id}`;

  return (
    <div
      className={cn(
        "space-y-1.5",
        // Questionnaire-authored classes — sanitized, never raw.
        sanitizeStylingClasses(question.styling_metadata?.containerClasses),
      )}
    >
      <div className="flex items-center gap-2">
        <label
          id={labelId}
          htmlFor={inputId}
          className="text-sm font-medium text-gray-800"
        >
          {question.text}
        </label>
        {question.required && <span className="text-red-500">*</span>}
      </div>
      {question.description && (
        <p className="text-xs text-gray-500">{question.description}</p>
      )}
      {question.type === "structured" ? (
        <StructuredQuestionSlot
          question={question}
          disabled={effectiveDisabled}
        />
      ) : (
        <div className="flex items-stretch overflow-hidden rounded-md border border-gray-200">
          <div className="min-w-0 flex-1">
            {InputComponent ? (
              <InputComponent
                question={question}
                disabled={effectiveDisabled}
                inputId={inputId}
                labelId={labelId}
              />
            ) : (
              <p className="p-2 text-sm italic text-gray-400">
                {t("unsupported_question_type")}
              </p>
            )}
          </div>
          {question.type !== "display" && (
            <NoteAffordance questionId={question.id} />
          )}
        </div>
      )}
      {errors.map((error, i) => (
        <p key={i} className="text-sm text-red-600">
          {error.msg ?? error.error}
        </p>
      ))}
    </div>
  );
}

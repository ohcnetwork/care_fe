import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { NoteAffordance } from "@/components/QuestionnaireV2/renderer/NoteAffordance";
import { QuestionGroupCard } from "@/components/QuestionnaireV2/renderer/QuestionGroupCard";
import { QUESTION_TYPE_COMPONENTS } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useRenderer } from "@/components/QuestionnaireV2/renderer/RendererContext";
import { sanitizeStylingClasses } from "@/components/QuestionnaireV2/renderer/sanitizeStylingClasses";
import {
  useQuestionEnabled,
  useQuestionErrors,
} from "@/components/QuestionnaireV2/renderer/store";
import { StructuredQuestionSlot } from "@/components/QuestionnaireV2/renderer/structured/StructuredQuestionSlot";
import { TopLevelCard } from "@/components/QuestionnaireV2/renderer/TopLevelCard";

import type { Question } from "@/types/questionnaire/question";

export function QuestionField({
  question,
  depth,
  number,
}: {
  question: Question;
  depth: number;
  /** Dotted ordinal matching the tree nav (e.g. "8." or "7.1."). */
  number?: string;
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
        number={number}
      />
    );
  }

  const InputComponent = QUESTION_TYPE_COMPONENTS[question.type];
  // Programmatic label association: text-like inputs take `id={inputId}` for
  // the htmlFor pairing; chip groups (boolean/choice) reference `labelId`
  // via aria-labelledby on their radiogroup container instead.
  const inputId = `question-input-${question.id}`;
  const labelId = `question-label-${question.id}`;

  // Chip groups (boolean / choice-with-options) sit directly on the card
  // background — wrapping them in a full-width bordered box would read as an
  // empty text input next to the chips.
  const isChipInput =
    question.type === "boolean" ||
    (question.type === "choice" && !!question.answer_option?.length);

  const field = (
    <div
      className={cn(
        "space-y-1.5",
        // Questionnaire-authored classes — sanitized, never raw.
        sanitizeStylingClasses(question.styling_metadata?.containerClasses),
      )}
    >
      <div className="flex items-center gap-2">
        {number && (
          <span className="shrink-0 text-sm font-medium text-gray-800 tabular-nums">
            {number}
          </span>
        )}
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
        <div
          className={cn(
            "flex items-stretch",
            !isChipInput &&
              "overflow-hidden rounded-md border border-gray-200 bg-white",
          )}
        >
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
            <NoteAffordance
              questionId={question.id}
              variant={isChipInput ? "standalone" : "merged"}
            />
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

  // Top-level plain questions get the same card shell as top-level groups.
  if (depth === 0) {
    return <TopLevelCard>{field}</TopLevelCard>;
  }

  return field;
}

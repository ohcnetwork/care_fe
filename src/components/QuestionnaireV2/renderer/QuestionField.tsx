import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { NoteAffordance } from "@/components/QuestionnaireV2/renderer/NoteAffordance";
import { QuestionGroupCard } from "@/components/QuestionnaireV2/renderer/QuestionGroupCard";
import { useRenderer } from "@/components/QuestionnaireV2/renderer/RendererContext";
import { QUESTION_TYPE_COMPONENTS } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import {
  useQuestionEnabled,
  useQuestionErrors,
} from "@/components/QuestionnaireV2/renderer/store";

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

  const InputComponent =
    question.type === "structured"
      ? null // Task 9 replaces this branch with <StructuredQuestionSlot />
      : QUESTION_TYPE_COMPONENTS[question.type];

  return (
    <div
      className={cn("space-y-1.5", question.styling_metadata?.containerClasses)}
    >
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-800">
          {question.text}
        </label>
        {question.required && <span className="text-red-500">*</span>}
      </div>
      {question.description && (
        <p className="text-xs text-gray-500">{question.description}</p>
      )}
      <div className="flex items-stretch overflow-hidden rounded-md border border-gray-200">
        <div className="min-w-0 flex-1">
          {InputComponent ? (
            <InputComponent question={question} disabled={effectiveDisabled} />
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
      {errors.map((error, i) => (
        <p key={i} className="text-sm text-red-600">
          {error.msg ?? error.error}
        </p>
      ))}
    </div>
  );
}

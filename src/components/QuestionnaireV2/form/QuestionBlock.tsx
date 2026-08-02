import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { emptyEntry } from "@/components/QuestionnaireV2/renderer/inputs/withEntryAt";
import { QUESTION_TYPE_COMPONENTS } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { sanitizeStylingClasses } from "@/components/QuestionnaireV2/renderer/sanitizeStylingClasses";
import {
  useQuestionEnabled,
  useQuestionErrors,
  useQuestionResponse,
} from "@/components/QuestionnaireV2/renderer/store";

import type { Question } from "@/types/questionnaire/question";

import { useFormChrome } from "./chrome";
import { useFormRenderer } from "./FormContext";
import { NoteControl } from "./NoteControl";
import { SectionCard } from "./SectionCard";
import { StructuredSlot } from "./StructuredSlot";

export interface QuestionBlockProps {
  question: Question;
  parentId: string | null;
  index: number;
  siblingCount: number;
  depth: number;
  /** Dotted ordinal matching the tree nav (e.g. "8." or "7.1."). */
  number?: string;
}

/**
 * One node of the questionnaire tree on the one-scroll canvas — the full
 * renderer's counterpart to the old paginated QuestionField. Same response
 * semantics (single-entry vs positional repeats, chip inputs, structured
 * slot, sanitized styling), new layout, plus the two canvas seams: chrome
 * wrapping and `revealHidden`/`inert` handling from the form context.
 */
export function QuestionBlock(props: QuestionBlockProps) {
  const { question, depth, number } = props;
  const { t } = useTranslation();
  const { mode, revealHidden, inert } = useFormRenderer();
  const { QuestionShell, QuestionAnnotation } = useFormChrome();
  const enabled = useQuestionEnabled(question);
  const errors = useQuestionErrors(question.id);
  // Only read for repeating questions (groups have no response entry).
  const [response, updateResponse] = useQuestionResponse(question.id);

  const hiddenByLogic = !enabled && question.disabled_display !== "protected";
  if (hiddenByLogic && !revealHidden) return null;

  const disabled = mode === "readonly" || question.read_only === true;
  const effectiveDisabled = disabled || !enabled;

  const wrap = (children: React.ReactNode) =>
    QuestionShell ? (
      <QuestionShell {...props} hiddenByLogic={hiddenByLogic}>
        {children}
      </QuestionShell>
    ) : (
      children
    );

  if (question.type === "group") {
    return wrap(
      <SectionCard
        question={question}
        depth={depth}
        disabled={effectiveDisabled}
        number={number}
      />,
    );
  }

  const InputComponent = QUESTION_TYPE_COMPONENTS[question.type];
  // Programmatic label association: text-like inputs take `id={inputId}` for
  // the htmlFor pairing; chip groups (boolean/choice) reference `labelId`
  // via aria-labelledby on their radiogroup container instead.
  const inputId = `question-input-${question.id}`;
  const labelId = `question-label-${question.id}`;

  // Chip groups (boolean/choice-with-options) sit directly on the card
  // background — wrapping them in a full-width bordered box would read as an
  // empty text input next to the chips.
  const isChipInput =
    question.type === "boolean" ||
    (question.type === "choice" && !!question.answer_option?.length);

  // Repeats → one input per value entry (legacy QuestionInput's per-index
  // rendering). Choice handles repeats itself (multi-select chips),
  // structured questions manage their own arrays, and display has no values
  // to repeat — those keep the single-input path.
  const isMultiEntry =
    !!InputComponent &&
    question.repeats === true &&
    question.type !== "structured" &&
    question.type !== "choice" &&
    question.type !== "display";

  const entryCount = Math.max(response?.values.length ?? 0, 1);
  const canRemoveEntries = (response?.values.length ?? 0) > 1;

  // Mirrors the legacy handleAddValue: adding from an empty response
  // materializes the on-screen placeholder entry too, so the new row never
  // swallows the one the user was looking at.
  const handleAddEntry = () => {
    const current = response?.values ?? [];
    const next = current.length === 0 ? [emptyEntry()] : [...current];
    next.push(emptyEntry());
    updateResponse({ values: next });
  };

  const handleRemoveEntry = (index: number) => {
    updateResponse({
      values: (response?.values ?? []).filter((_, i) => i !== index),
    });
  };

  return wrap(
    // data-question-id is the renderer's stable per-question DOM anchor —
    // hosts scroll to it (outline selection, future scroll-to-error) and
    // tests scope input assertions with it.
    <div
      data-question-id={question.id}
      className={cn(
        "space-y-1.5",
        depth <= 1 && "rounded-lg border border-gray-200 bg-white p-3.5",
        // Questionnaire-authored classes — sanitized, never raw.
        sanitizeStylingClasses(question.styling_metadata?.containerClasses),
      )}
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className="mt-1 h-3.5 w-0.5 shrink-0 rounded-full bg-primary-600"
        />
        {number && (
          <span className="shrink-0 text-sm font-medium text-gray-500 tabular-nums">
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
        {/* Question-level unit, any type (legacy QuestionLabel contract):
            integer/decimal/choice have no answer-time unit picker, so this
            suffix is their only unit display. */}
        {question.unit?.code && (
          <span className="text-sm text-gray-500">({question.unit.code})</span>
        )}
      </div>
      {question.description && (
        <p className="pl-2.5 text-xs text-gray-500">{question.description}</p>
      )}
      {QuestionAnnotation && <QuestionAnnotation question={question} />}
      {/* The interactive area: inert on the builder's edit canvas so clicks
          fall through to the selection chrome and none of these controls
          surface in the a11y tree. */}
      <div inert={inert || undefined}>
        {question.type === "structured" ? (
          <StructuredSlot question={question} disabled={effectiveDisabled} />
        ) : isMultiEntry ? (
          <div className="space-y-2">
            {Array.from({ length: entryCount }, (_, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className={cn(
                    "min-w-0 flex-1",
                    !isChipInput &&
                      "overflow-hidden rounded-md border border-gray-200 bg-white",
                  )}
                >
                  <InputComponent
                    question={question}
                    disabled={effectiveDisabled}
                    inputId={index === 0 ? inputId : `${inputId}-${index}`}
                    labelId={labelId}
                    valueIndex={index}
                  />
                </div>
                {canRemoveEntries && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    disabled={effectiveDisabled}
                    onClick={() => handleRemoveEntry(index)}
                    aria-label={t("remove")}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={effectiveDisabled}
                onClick={handleAddEntry}
              >
                <Plus className="size-4" />
                {t("add_another")}
              </Button>
              <NoteControl questionId={question.id} variant="standalone" />
            </div>
          </div>
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
              <NoteControl
                questionId={question.id}
                variant={isChipInput ? "standalone" : "merged"}
              />
            )}
          </div>
        )}
      </div>
      {errors.map((error, i) => (
        <p key={i} className="text-sm text-red-600">
          {error.msg ?? error.error}
        </p>
      ))}
    </div>,
  );
}

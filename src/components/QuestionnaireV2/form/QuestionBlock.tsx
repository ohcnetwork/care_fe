import { Plus, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { emptyEntry } from "@/components/QuestionnaireV2/form/engine/inputs/withEntryAt";
import { QUESTION_TYPE_COMPONENTS } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";
import { sanitizeStylingClasses } from "@/components/QuestionnaireV2/form/engine/sanitizeStylingClasses";
import {
  useQuestionEnabled,
  useQuestionErrors,
  useQuestionResponse,
} from "@/components/QuestionnaireV2/form/engine/store";

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
  const { mode, revealHidden, frozen } = useFormRenderer();
  const { QuestionShell } = useFormChrome();
  const enabled = useQuestionEnabled(question);

  const hiddenByLogic = !enabled && question.disabled_display !== "protected";
  if (hiddenByLogic && !revealHidden) return null;

  const disabled = mode === "readonly" || question.read_only === true || frozen;
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

  return wrap(
    <LeafBlock
      question={question}
      depth={depth}
      number={number}
      effectiveDisabled={effectiveDisabled}
    />,
  );
}

/**
 * The non-group body — a separate component so the response and error
 * store subscriptions only exist for questions that actually record
 * answers (groups returned above without ever mounting them).
 */
function LeafBlock({
  question,
  depth,
  number,
  effectiveDisabled,
}: {
  question: Question;
  depth: number;
  number?: string;
  effectiveDisabled: boolean;
}) {
  const { t } = useTranslation();
  const { inert } = useFormRenderer();
  const { QuestionAnnotation } = useFormChrome();
  const errors = useQuestionErrors(question.id);
  // Only written by repeating questions; read for entry counts.
  const [response, updateResponse] = useQuestionResponse(question.id);

  const InputComponent = QUESTION_TYPE_COMPONENTS[question.type];
  // Programmatic label association: text-like inputs take `id={inputId}` for
  // the htmlFor pairing; chip groups (boolean/choice) reference `labelId`
  // via aria-labelledby on their radiogroup container instead.
  const inputId = `question-input-${question.id}`;
  const labelId = `question-label-${question.id}`;

  // Repeats → one input per value entry (legacy QuestionInput's per-index
  // rendering). A fixed-option (`answer_option`) choice handles repeats
  // itself (multi-select chips/dropdown render every selected value at
  // once); a valueset-backed choice (`answer_value_set`) has no such
  // built-in multi-value control, so it drives this shared per-index path
  // like every other repeating input. Structured questions manage their own
  // arrays, and display has no values to repeat — those keep the
  // single-input path.
  //
  // Mirrors ChoiceInput's OWN branch order, not just "has a valueset":
  // ChoiceInput checks `answer_option?.length` first and only falls
  // through to the valueset branch when that's empty, so a legacy/imported
  // question carrying BOTH fields still renders (and writes) through the
  // answer_option control. Gating on `!answer_value_set` here instead would
  // send that same question through the per-index path while ChoiceInput
  // keeps ignoring `valueIndex` in its answer_option branch — every entry
  // rendering the identical whole-array-replacing multi-select, which is
  // worse than the pre-fix behavior this is supposed to correct.
  const isSelfManagedChoice =
    question.type === "choice" && !!question.answer_option?.length;

  const isMultiEntry =
    !!InputComponent &&
    question.repeats === true &&
    question.type !== "structured" &&
    question.type !== "display" &&
    !isSelfManagedChoice;

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

  // A structured question renders its own field-bound errors inline (beside
  // the control that owns them, via StructuredFieldError); the block-level
  // list below is only for section-level structured errors (no field_key)
  // and every error of a non-structured question.
  const blockErrors =
    question.type === "structured"
      ? errors.filter((error) => !error.field_key)
      : errors;

  return (
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
        {/* Visual-only: the programmatic required state is aria-required
            on the input itself (every engine input sets it). */}
        {question.required && (
          <span aria-hidden className="text-red-500">
            *
          </span>
        )}
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
                <div className="min-w-0 flex-1">
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
              <NoteControl questionId={question.id} />
            </div>
          </div>
        ) : (
          // Single-border model (reference design): each control keeps its
          // own border; the note affordance sits behind a slim divider
          // instead of sharing a second outer frame.
          <div className="flex items-stretch gap-0.5">
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
              <NoteControl questionId={question.id} />
            )}
          </div>
        )}
      </div>
      {/* role="alert" so a validation failure is ANNOUNCED, not only
          drawn: client-side validation writes these straight into the
          store with no other live region anywhere on the fill page.
          A structured question's field-bound errors are rendered inline,
          beside their control, by StructuredFieldError; printing them here
          as well showed every message twice. SECTION-level structured
          errors carry no field_key (structured_section_unavailable_required,
          structured_question_validate_failed) and must stay — they are the
          hard-block messages. Non-structured questions are untouched, which
          is what keeps `fillValidation.spec.ts:33-40,47-54` green. */}
      {blockErrors.map((error, i) => (
        <p key={i} role="alert" className="text-sm text-red-600">
          {error.msg ?? error.error}
        </p>
      ))}
    </div>
  );
}

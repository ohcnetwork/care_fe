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
 * Structured types whose editor renders its own field-bound errors inline
 * via `StructuredFieldError` — directly, or through `StructuredList`'s
 * per-cell rendering (plus its unmatched-field_key fallback). For these,
 * `LeafBlock` prints only errors WITHOUT a `field_key`; every other type
 * prints all errors. Deliberately an explicit set, not "every structured
 * question": a type joins in the same commit that wires the primitive.
 * Listed-but-unwired silently deletes a field error's only display;
 * wired-but-unlisted merely double-prints it.
 */
const STRUCTURED_TYPES_WITH_INLINE_FIELD_ERRORS = new Set<string>([
  "allergy_intolerance",
  "appointment",
  "charge_item",
  "diagnosis",
  "files",
  "medication_request",
  "medication_statement",
  "service_request",
  "symptom",
]);

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

  // Repeating questions render one input per value entry, except fixed-option
  // choices, which render every selected value through their own multi-select
  // control. The branch matches ChoiceInput: `answer_option` wins over
  // `answer_value_set` when both are present.
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

  // Adding from an empty response materializes the on-screen placeholder entry
  // too, so the new row never swallows the one the user was looking at.
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

  // Structured questions suppress block-level field errors only when their
  // editor renders `StructuredFieldError` itself. Listed-but-unwired types hide
  // the only error display; unlisted-but-wired types double-print messages.
  const blockErrors =
    question.type === "structured" &&
    question.structured_type &&
    STRUCTURED_TYPES_WITH_INLINE_FIELD_ERRORS.has(question.structured_type)
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
        {/* Question-level unit display for types without answer-time unit pickers. */}
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
      {/* role="alert" announces validation failures; structured field-bound
          errors render inline while section-level errors stay here. */}
      {/* Message resolution uses `error.error || error.msg` so empty strings
          fall through instead of rendering blank. */}
      {blockErrors.map((error, i) => (
        <p key={i} role="alert" className="text-sm text-red-600">
          {error.error || error.msg || t("field_required")}
        </p>
      ))}
    </div>
  );
}

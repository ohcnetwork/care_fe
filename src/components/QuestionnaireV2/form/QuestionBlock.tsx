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
 * via `StructuredFieldError`, and therefore should NOT have those same
 * errors printed again in `LeafBlock`'s block-level list. Module scope —
 * see `LeafBlock`'s `blockErrors` for why this must be an explicit,
 * deliberately-maintained set rather than "every structured question":
 * a type added to contract v2 does not get inline field errors until its
 * OWN commit wires `StructuredFieldError` and adds itself here.
 *
 * REVIEW FIX: `time_of_death` does NOT belong here — its editor
 * (`TimeOfDeathEditor.tsx`) renders no `StructuredFieldError` (verified:
 * zero references) and its definition has no `validate` at all, so it
 * never produces a `field_key`-bound error today. Listing it anyway would
 * be inert now but pre-arm the exact CRITICAL this set exists to prevent:
 * the first `field_key`-bearing error that type ever sees (a future
 * client validator, or a positional server error) would vanish with
 * nowhere to show it. Re-add it in the commit that actually wires the
 * primitive for that type.
 *
 * `charge_item` IS listed — verified, not assumed: `ChargeItemEditor.tsx`
 * renders through `StructuredList` (`core/StructuredList.tsx`), which
 * renders `<StructuredFieldError>` per cell itself (`:411`) via the same
 * `selectStructuredFieldErrors` match this file's own filter uses. Its
 * `quantity` column's error (`required: true`, no `ownsErrorDisplay`)
 * therefore already renders inline — omitting it from this set was the
 * double-print in reverse.
 *
 * `allergy_intolerance` IS listed — same reason as `charge_item`:
 * `AllergyEditor.tsx` renders through `StructuredList`, which renders
 * `<StructuredFieldError>` per cell for every one of its columns (none set
 * `ownsErrorDisplay`), plus the shell's own unmatched-`field_key` fallback
 * for anything none of those columns claims (e.g. a server error keyed on
 * `code`, which this type's columns intentionally name `substance`
 * instead). Omitting it here would double-print any such error.
 *
 * `symptom` IS listed — identical reasoning to `allergy_intolerance`:
 * `SymptomEditor.tsx` renders through `StructuredList` too (none of its six
 * columns set `ownsErrorDisplay`), plus the same unmatched-`field_key`
 * fallback for a server error keyed on a name none of those columns claims
 * (e.g. `code`, which this type's identity column names `"code"` too, but
 * `onset`/`onset.onset_datetime` would not match the `"onset"` column key
 * either way it's keyed).
 *
 * `diagnosis` IS listed — same reasoning again: `DiagnosisEditor.tsx`
 * renders through `StructuredList`, none of its six columns set
 * `ownsErrorDisplay`, and the identity column's key (`"diagnosis"`, the
 * code's display text) intentionally does NOT match the wire field
 * `code` — a server error keyed on `code` hits the unmatched-`field_key`
 * fallback, not silence.
 *
 * `medication_request` IS listed — `MedicationRequestEditor.tsx` renders
 * through `StructuredList`; its `dosage`/`frequency`/`duration` columns set
 * `ownsErrorDisplay` (each renders one `StructuredFieldError` PER dosage
 * instruction, not one per cell) and every other column relies on the
 * shell's default per-cell rendering. This type's own client `validate`
 * (`invalidDosageFieldErrors`, row-scoped, index-suffixed field keys like
 * `dosage_instruction[0].dose`) renders inline through exactly this
 * mechanism — plus the shell's own unmatched-`field_key` fallback for a row
 * whose `dosage_instruction` array is empty (a `field_key` no column
 * claims).
 *
 * `medication_statement` IS listed — same reasoning again:
 * `MedicationStatementEditor.tsx` renders through `StructuredList`, none of
 * its seven columns set `ownsErrorDisplay`, and this type's own client
 * `validate` (`dosage_text`/`effective_period`, row-scoped) renders inline
 * through exactly that mechanism — plus the shell's own unmatched-
 * `field_key` fallback for anything a server error keys on that no column
 * claims (e.g. `medication`, which this type's identity column names
 * `"medicine"` instead).
 *
 * `service_request` IS listed — same reasoning again:
 * `ServiceRequestEditor.tsx` renders through `StructuredList`, none of its
 * columns set `ownsErrorDisplay`, and this type's own client `validate`
 * (`requiredServiceRequestFieldMisses`, row-scoped) renders inline through
 * exactly that mechanism — `priority`/`category` bind to real columns,
 * while `title`/`status`/`intent`/`code` hit the shell's own
 * unmatched-`field_key` fallback instead of vanishing.
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
  // the control that owns them, via StructuredFieldError) ONLY if its
  // editor actually consumes the primitive — REVIEW FIX (CRITICAL): the
  // first version of this filter fired for `question.type === "structured"`
  // unconditionally, which silently deleted the ONLY error display of a type
  // that accepts an `errors` prop and never renders it. The legacy
  // `FileQuestion` was exactly that shape, and its validator fires on the
  // NORMAL path (every upload is seeded with an empty name), so an unnamed
  // upload hard-blocked Save with no visible reason anywhere.
  //
  // Gated explicitly (`STRUCTURED_TYPES_WITH_INLINE_FIELD_ERRORS`, above) on
  // the types whose editor renders `StructuredFieldError` itself — directly,
  // or through `StructuredList`, which renders it per cell for the column
  // whose `errorFieldKeys` match. **A type joins that set in the same commit
  // that wires the primitive, never before**: listed-but-unwired deletes the
  // message, unlisted-but-wired merely double-prints it. Both were shipped
  // once each in this phase and caught in review.
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
      {/* Message resolution order matches `StructuredFieldError` and the
          legacy `QuestionTypes/FieldError.tsx:30` exactly — `error.error`
          first, `||` not `??` (an empty-string `error.error` must fall
          through to `msg`, not render blank). One canonical order across
          all three sites, not three independent ones. */}
      {blockErrors.map((error, i) => (
        <p key={i} role="alert" className="text-sm text-red-600">
          {error.error || error.msg || t("field_required")}
        </p>
      ))}
    </div>
  );
}

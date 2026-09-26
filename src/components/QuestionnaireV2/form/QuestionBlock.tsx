import { memo, useId } from "react";

import { cn } from "@/lib/utils";

import { sanitizeStylingClasses } from "@/components/QuestionnaireV2/form/engine/sanitizeStylingClasses";
import {
  useQuestionEnabled,
  useQuestionErrors,
} from "@/components/QuestionnaireV2/form/engine/store";

import type { Question } from "@/types/questionnaire/question";

import { useFormChrome } from "./chrome";
import { useFormRenderer } from "./FormContext";
import { QuestionAnswerInput } from "./QuestionAnswerInput";
import { SectionCard } from "./SectionCard";

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
export const QuestionBlock = memo(function QuestionBlock(
  props: QuestionBlockProps,
) {
  const { question, depth, number } = props;
  const { mode, revealHidden, frozen } = useFormRenderer();
  const { QuestionShell } = useFormChrome();
  const enabled = useQuestionEnabled(question);

  const hiddenByLogic = !enabled && question.disabled_display !== "protected";
  if (hiddenByLogic && !revealHidden) return null;

  // Two distinct states, and only inputs take both: `locked` is the question's
  // persistent inertness, `frozen` is the in-flight submit. Anything that
  // decides whether a control RENDERS must read `locked` alone — the freeze
  // lasts one request, and a control that unmounts for it reflows the form
  // mid-submit and flickers back on failure.
  const locked = mode === "readonly" || question.read_only === true || !enabled;
  const effectiveDisabled = locked || frozen;

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
      locked={locked}
    />,
  );
});

/**
 * The non-group chrome subscribes only to validation errors. Answer controls
 * own their response subscriptions; groups never mount either subscription.
 */
function LeafBlock({
  question,
  depth,
  number,
  effectiveDisabled,
  locked,
}: {
  question: Question;
  depth: number;
  number?: string;
  effectiveDisabled: boolean;
  locked: boolean;
}) {
  const { inert } = useFormRenderer();
  const { QuestionAnnotation } = useFormChrome();
  const errors = useQuestionErrors(question.id);
  const errorsId = useId();
  const errorId = errors.length > 0 ? errorsId : undefined;
  // Text-like inputs use htmlFor; chip groups use aria-labelledby.
  const inputId = `question-input-${question.id}`;
  const labelId = `question-label-${question.id}`;

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
        {/* Visual-only: inputs expose their required state directly, and
            composite groups describe the requirement accessibly. */}
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
        <QuestionAnswerInput
          question={question}
          disabled={effectiveDisabled}
          locked={locked}
          inputId={inputId}
          labelId={labelId}
          errorId={errorId}
        />
      </div>
      {/* role="alert" so a validation failure is ANNOUNCED, not only
          drawn: client-side validation writes these straight into the
          store with no other live region anywhere on the fill page. */}
      {errors.length > 0 && (
        <div id={errorId} className="space-y-1">
          {errors.map((error, i) => (
            <p key={i} role="alert" className="text-sm text-red-600">
              {error.msg ?? error.error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

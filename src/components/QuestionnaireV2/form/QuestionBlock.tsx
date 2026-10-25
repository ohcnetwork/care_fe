import { memo, useId } from "react";

import { cn } from "@/lib/utils";

import { sanitizeStylingClasses } from "@/components/QuestionnaireV2/form/engine/sanitizeStylingClasses";
import {
  useQuestionEnabled,
  useQuestionErrors,
} from "@/components/QuestionnaireV2/form/engine/store";

import type { Question } from "@/types/questionnaire/question";

import { RegisteredGroupSlot } from "@/components/QuestionnaireV2/groups/RegisteredGroupSlot";
import { useFormChrome } from "./chrome";
import { useResponseScope } from "./engine/responseScope";
import { useFormRenderer } from "./FormContext";
import { QuestionAnswerInput } from "./QuestionAnswerInput";
import { RepeatingGroup } from "./RepeatingGroup";
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

/** One node of the questionnaire tree on the one-scroll canvas. */
export const QuestionBlock = memo(function QuestionBlock(
  props: QuestionBlockProps,
) {
  const { question, depth, number } = props;
  const { mode, revealHidden, frozen } = useFormRenderer();
  const { QuestionShell } = useFormChrome();
  const enabled = useQuestionEnabled(question);

  const hiddenByLogic = !enabled && question.disabled_display !== "protected";
  if (hiddenByLogic && !revealHidden) return null;

  // `locked` is persistent; `frozen` lasts one submit and must never decide
  // whether a control renders.
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
    const Group = question.structured_type
      ? RegisteredGroupSlot
      : question.repeats
        ? RepeatingGroup
        : SectionCard;
    return wrap(
      <Group
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
  const path = useResponseScope();
  const { QuestionAnnotation } = useFormChrome();
  const errors = useQuestionErrors(question.id);
  const errorsId = useId();
  const errorId = errors.length > 0 ? errorsId : undefined;
  const suffix = path.length
    ? `-row-${path.map((entry) => entry.rowIndex).join("-")}`
    : "";
  const inputId = `question-input-${question.id}${suffix}`;
  const labelId = `question-label-${question.id}${suffix}`;

  const containerClassName = cn(
    "space-y-1.5",
    depth <= 1 && "rounded-lg border border-gray-200 bg-white p-3.5",
    sanitizeStylingClasses(question.styling_metadata?.containerClasses),
  );

  if (question.type === "display") {
    return (
      <div
        data-question-id={question.id}
        data-response-path={JSON.stringify(path)}
        className={containerClassName}
      >
        <div className="flex items-start gap-2">
          {number && (
            <span className="shrink-0 text-sm font-medium text-gray-500 tabular-nums">
              {number}
            </span>
          )}
          <p className="text-sm text-gray-800">{question.text}</p>
        </div>
        {question.description && (
          <p className="text-xs text-gray-500">{question.description}</p>
        )}
        {QuestionAnnotation && <QuestionAnnotation question={question} />}
      </div>
    );
  }

  return (
    <div
      data-question-id={question.id}
      data-response-path={JSON.stringify(path)}
      className={containerClassName}
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
        {question.required && (
          <span aria-hidden className="text-red-500">
            *
          </span>
        )}
        {question.unit?.code && (
          <span className="text-sm text-gray-500">({question.unit.code})</span>
        )}
      </div>
      {question.description && (
        <p className="pl-2.5 text-xs text-gray-500">{question.description}</p>
      )}
      {QuestionAnnotation && <QuestionAnnotation question={question} />}
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

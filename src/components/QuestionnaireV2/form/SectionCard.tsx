import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import { sanitizeStylingClasses } from "@/components/QuestionnaireV2/form/engine/sanitizeStylingClasses";
import { countLeafQuestions } from "@/components/QuestionnaireV2/shared/questionTree";

import type { Question } from "@/types/questionnaire/question";

import { useFormChrome } from "./chrome";
import { useFormRenderer } from "./FormContext";
import { QuestionBlock } from "./QuestionBlock";

/** Group rendering: top-level groups as sections, nested groups two-tone. */
export function SectionCard({
  question,
  depth,
  disabled,
  number,
}: {
  question: Question;
  depth: number;
  disabled: boolean;
  /** Dotted ordinal matching the tree nav (e.g. "7."). */
  number?: string;
}) {
  const { t } = useTranslation();
  const { inert } = useFormRenderer();
  const { AppendZone, QuestionAnnotation } = useFormChrome();

  // A natively disabled fieldset would also disable the edit canvas's chrome.
  const fieldsetDisabled = disabled && !inert;
  const children = question.questions ?? [];
  const sectionQuestionCount = countLeafQuestions(children);
  const leafChildCount = children.filter(
    (child) => child.type !== "group",
  ).length;

  const decorationClasses = sanitizeStylingClasses(
    question.styling_metadata?.classes,
  );
  const containerClasses = sanitizeStylingClasses(
    question.styling_metadata?.containerClasses,
  );

  const childNumber = (index: number) =>
    number ? `${number}${index + 1}.` : undefined;

  const renderChildren = () =>
    children.map((child, index) => (
      <QuestionBlock
        key={child.id}
        question={child}
        parentId={question.id}
        index={index}
        siblingCount={children.length}
        depth={depth + 1}
        number={childNumber(index)}
      />
    ));

  if (depth === 0) {
    return (
      <section
        data-question-id={question.id}
        className={cn(
          "rounded-xl border border-gray-200 bg-gray-50 p-3.5",
          decorationClasses,
        )}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            aria-hidden
            className="h-4 w-1 shrink-0 rounded-full bg-primary-600"
          />
          <h3 className="text-sm font-semibold text-gray-900">
            {number && <span className="mr-1 tabular-nums">{number}</span>}
            {question.text}
          </h3>
          <Badge variant="outline">{t("group")}</Badge>
          <span className="ml-auto text-xs text-gray-400">
            {t("n_questions", { count: sectionQuestionCount })}
          </span>
        </div>
        {question.description && (
          <p className="-mt-1 mb-3 text-xs text-gray-500">
            {question.description}
          </p>
        )}
        {QuestionAnnotation && (
          <div className="mb-3">
            <QuestionAnnotation question={question} />
          </div>
        )}
        <fieldset
          disabled={fieldsetDisabled}
          className={cn(
            "border-0 p-0",
            containerClasses ? cn("gap-3", containerClasses) : "space-y-3",
          )}
        >
          {renderChildren()}
        </fieldset>
        {AppendZone && <AppendZone parentId={question.id} />}
      </section>
    );
  }

  return (
    <div
      data-question-id={question.id}
      className={cn(
        "overflow-hidden rounded-md border border-gray-200 bg-gray-200/60",
        decorationClasses,
      )}
    >
      <h4 className="px-3 py-1.5 text-sm font-semibold text-gray-900">
        {number && <span className="mr-1 tabular-nums">{number}</span>}
        {question.text}
      </h4>
      {question.description && (
        <p className="px-3 pb-1.5 text-xs text-gray-500">
          {question.description}
        </p>
      )}
      <fieldset
        disabled={fieldsetDisabled}
        className={cn(
          "m-1 gap-4 rounded border-0 bg-gray-50 p-2",
          containerClasses ??
            cn("grid sm:grid-cols-2", leafChildCount >= 3 && "sm:grid-cols-3"),
        )}
      >
        {renderChildren()}
      </fieldset>
      {AppendZone && <AppendZone parentId={question.id} />}
    </div>
  );
}

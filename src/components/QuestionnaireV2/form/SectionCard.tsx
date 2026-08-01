import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import { sanitizeStylingClasses } from "@/components/QuestionnaireV2/renderer/sanitizeStylingClasses";

import type { Question } from "@/types/questionnaire/question";

import { useFormChrome } from "./chrome";
import { QuestionBlock } from "./QuestionBlock";

/**
 * Group rendering on the one-scroll canvas. Top-level groups are the
 * reference design's "sections": soft card, accent bar, numbered title,
 * question count, children as white question cards. Nested groups keep the
 * old renderer's two-tone treatment. Both preserve the deployed contracts:
 * `<fieldset disabled>` threads disabled state to native children,
 * `styling_metadata.classes` decorates the wrapper, `containerClasses` lays
 * out the sub-question container — all through `sanitizeStylingClasses`.
 */
export function SectionCard({
  question,
  depth,
  disabled,
  number,
}: {
  question: Question;
  depth: number;
  disabled: boolean;
  /** Dotted ordinal matching the tree nav (e.g. "7."); children derive
   *  "7.1.", "7.2.", … from it. */
  number?: string;
}) {
  const { t } = useTranslation();
  const { AppendZone } = useFormChrome();
  const children = question.questions ?? [];
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
            {t("n_questions", { count: leafChildCount })}
          </span>
        </div>
        {question.description && (
          <p className="-mt-1 mb-3 text-xs text-gray-500">
            {question.description}
          </p>
        )}
        <fieldset
          disabled={disabled}
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

  // Nested group: two-tone box — the title sits in its own darker header
  // strip with a lighter inset body panel beneath it.
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-gray-200 bg-gray-200/60",
        decorationClasses,
      )}
    >
      <h4 className="px-3 py-1.5 text-sm font-semibold text-gray-900">
        {number && <span className="mr-1 tabular-nums">{number}</span>}
        {question.text}
      </h4>
      <fieldset
        disabled={disabled}
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

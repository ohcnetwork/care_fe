import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Question } from "@/types/questionnaire/question";

import { TreeItem, numberQuestions } from "./questionTree";

export interface QuestionTreeNavProps {
  title?: string;
  questions: Question[];
  activeId: string | null;
  onSelect: (questionId: string) => void;
  footer?: React.ReactNode;
  /** Builder-only affordances (insert-between "+" buttons etc.) */
  renderSeparator?: (afterIndex: number) => React.ReactNode;
  /** Question ids (any depth) currently hidden by enable_when (renderer
   *  only) — skipped entirely, matching the legacy renderer where hidden
   *  questions simply don't appear. Numbering stays stable across hides. */
  hiddenIds?: Set<string>;
}

export function QuestionTreeNav({
  title,
  questions,
  activeId,
  onSelect,
  footer,
  renderSeparator,
  hiddenIds,
}: QuestionTreeNavProps) {
  const { t } = useTranslation();
  const items = numberQuestions(questions).filter(
    (item) => !hiddenIds?.has(item.question.id),
  );

  const row = (item: TreeItem, indent: boolean) => (
    <button
      key={item.question.id}
      type="button"
      onClick={() => onSelect(item.question.id)}
      className={cn(
        "relative flex w-full items-start gap-1 rounded-md px-3 py-2 text-left text-sm",
        indent && "ml-2",
        activeId === item.question.id
          ? "bg-gray-100 font-medium text-gray-900"
          : "text-gray-700 hover:bg-gray-50",
      )}
    >
      <span className="shrink-0">{item.number}</span>
      <span className="min-w-0">
        {item.question.text || (
          <span className="italic text-gray-400">{t("untitled_question")}</span>
        )}
      </span>
      {activeId === item.question.id && (
        <span className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gray-900" />
      )}
    </button>
  );

  return (
    <nav aria-label={title} className="w-full space-y-1">
      {title && (
        <h3 className="px-3 py-2 text-sm font-semibold text-gray-900">
          {title}
        </h3>
      )}
      {items.map((item, index) => {
        // Hidden children drop out too — a row for a question that isn't on
        // the page is a dead end. Numbering stays stable across hides.
        const children = item.children.filter(
          (child) => !hiddenIds?.has(child.question.id),
        );
        return (
          <Fragment key={item.question.id}>
            {row(item, false)}
            {children.length > 0 && (
              <div className="ml-3 border-l border-gray-200 pl-1">
                {children.map((child) => row(child, true))}
              </div>
            )}
            {index < items.length - 1 && (
              <div className="relative my-1 border-t border-gray-100">
                {renderSeparator?.(index)}
              </div>
            )}
          </Fragment>
        );
      })}
      {footer}
    </nav>
  );
}

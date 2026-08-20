import { Fragment } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Question } from "@/types/questionnaire/question";

import { TreeItem, numberQuestions } from "./questionTree";
import { QUESTION_TYPE_ICONS } from "./questionTypeIcons";

export interface QuestionTreeNavProps {
  title?: string;
  questions: Question[];
  activeId: string | null;
  onSelect: (questionId: string) => void;
  footer?: React.ReactNode;
  /** Builder-only affordances (insert-between "+" buttons etc.) */
  renderSeparator?: (afterIndex: number) => React.ReactNode;
  /** Question ids currently hidden by enable_when; numbering stays stable. */
  hiddenIds?: Set<string>;
  /** Decorative per-row trailing icons (the studio's logic/issue cues) —
   *  rendered aria-hidden so row accessible names stay number + title. */
  rowAdornment?: (question: Question) => React.ReactNode;
  /** Accessible name for the `nav` landmark when the consumer renders its
   *  own visible heading instead of passing `title`. Supply one of the two. */
  ariaLabel?: string;
}

export function QuestionTreeNav({
  title,
  questions,
  activeId,
  onSelect,
  footer,
  renderSeparator,
  hiddenIds,
  rowAdornment,
  ariaLabel,
}: QuestionTreeNavProps) {
  const { t } = useTranslation();
  const items = numberQuestions(questions).filter(
    (item) => !hiddenIds?.has(item.question.id),
  );

  const row = (item: TreeItem, indent: boolean) => {
    const { icon: TypeIcon, tint } = QUESTION_TYPE_ICONS[item.question.type];
    return (
      <button
        key={item.question.id}
        type="button"
        aria-current={activeId === item.question.id ? "true" : undefined}
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
        {/* Decorative type recognition cue; aria-hidden keeps row names unchanged. */}
        <span
          aria-hidden
          className={cn(
            "mt-px flex size-4 shrink-0 items-center justify-center rounded-sm",
            tint,
          )}
        >
          <TypeIcon className="size-3" />
        </span>
        <span className="min-w-0 flex-1">
          {item.question.text || (
            <span className="italic text-gray-400">
              {t("untitled_question")}
            </span>
          )}
        </span>
        {rowAdornment && (
          <span
            aria-hidden
            className="mr-1 flex shrink-0 items-center gap-1 self-center"
          >
            {rowAdornment(item.question)}
          </span>
        )}
        {activeId === item.question.id && (
          <span className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-gray-900" />
        )}
      </button>
    );
  };

  return (
    <nav aria-label={ariaLabel ?? title} className="w-full space-y-1">
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

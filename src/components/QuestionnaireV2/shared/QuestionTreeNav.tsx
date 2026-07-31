import { Fragment } from "react";

import { cn } from "@/lib/utils";

import { Question } from "@/types/questionnaire/question";

export interface TreeItem {
  question: Question;
  number: string;
  children: TreeItem[];
}

/** Top-level questions get 1., 2., …; children get parent.child (1.1., 1.2.). */
export function numberQuestions(questions: Question[]): TreeItem[] {
  return questions.map((question, i) => ({
    question,
    number: `${i + 1}.`,
    children: (question.questions ?? []).map((child, j) => ({
      question: child,
      number: `${i + 1}.${j + 1}.`,
      children: [],
    })),
  }));
}

export interface QuestionTreeNavProps {
  title?: string;
  questions: Question[];
  activeId: string | null;
  onSelect: (questionId: string) => void;
  footer?: React.ReactNode;
  /** Builder-only affordances (insert-between "+" buttons etc.) */
  renderSeparator?: (afterIndex: number) => React.ReactNode;
}

export function QuestionTreeNav({
  title,
  questions,
  activeId,
  onSelect,
  footer,
  renderSeparator,
}: QuestionTreeNavProps) {
  const items = numberQuestions(questions);

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
      <span className="min-w-0">{item.question.text}</span>
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
      {items.map((item, index) => (
        <Fragment key={item.question.id}>
          {row(item, false)}
          {item.children.length > 0 && (
            <div className="ml-3 border-l border-gray-200 pl-1">
              {item.children.map((child) => row(child, true))}
            </div>
          )}
          {index < items.length - 1 && (
            <div className="relative my-1 border-t border-gray-100">
              {renderSeparator?.(index)}
            </div>
          )}
        </Fragment>
      ))}
      {footer}
    </nav>
  );
}

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

/** Does `question` (or any of its descendants) have id `questionId`? */
function containsQuestion(question: Question, questionId: string): boolean {
  if (question.id === questionId) return true;
  return (question.questions ?? []).some((child) =>
    containsQuestion(child, questionId),
  );
}

/** Maps any question id (top-level or nested) to the index of its top-level
 *  ancestor in `questions` — so selecting a child in the tree nav pages to
 *  its containing top-level question. */
export function findTopLevelIndex(
  questions: Question[],
  questionId: string,
): number {
  const index = questions.findIndex((question) =>
    containsQuestion(question, questionId),
  );
  return index === -1 ? 0 : index;
}

/**
 * Looks up `questionId`'s own dotted number (e.g. "3." or "3.1.") from
 * `numberQuestions`'s two-level output. Returns undefined for ids nested
 * deeper than that (grandchildren+), since `numberQuestions` only numbers
 * top-level questions and their immediate children — callers should fall
 * back to the top-level ancestor's ordinal in that case.
 */
export function findQuestionNumber(
  questions: Question[],
  questionId: string,
): string | undefined {
  for (const item of numberQuestions(questions)) {
    if (item.question.id === questionId) return item.number;
    const child = item.children.find(
      (childItem) => childItem.question.id === questionId,
    );
    if (child) return child.number;
  }
  return undefined;
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

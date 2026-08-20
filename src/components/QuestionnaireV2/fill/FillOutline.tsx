import { CheckCheck, Dot } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  useAnsweredQuestionIds,
  useFormRenderer,
  useHiddenQuestionIds,
} from "@/components/QuestionnaireV2/form/FormContext";
import type { TreeItem } from "@/components/QuestionnaireV2/shared/questionTree";
import {
  findFirstQuestion,
  findTopLevelIndex,
  numberQuestions,
} from "@/components/QuestionnaireV2/shared/questionTree";

import type { Question } from "@/types/questionnaire/question";

import { useFillOutlineNav } from "./FillOutlineOverlay";

/**
 * One form's rows inside the outline overlay panel: two levels of rows with
 * completion adornments and active-state mapping for deeper descendants.
 * Rows stay mounted only while their question is visible.
 */
export function FillOutline({ ariaLabel }: { ariaLabel?: string }) {
  const { t } = useTranslation();
  const { questionnaire } = useFormRenderer();
  const hiddenIds = useHiddenQuestionIds();
  const answeredIds = useAnsweredQuestionIds();
  const { activeQuestionId, scrollToQuestion } = useFillOutlineNav();

  const items = numberQuestions(questionnaire.questions).filter(
    (item) => !hiddenIds.has(item.question.id),
  );

  // The outline shows two levels; the scroll-spy reports any depth. An
  // active id with its own row highlights that row, a deeper descendant
  // highlights its top-level ancestor, another form's id highlights
  // nothing here.
  const hasRow = (questionId: string) =>
    items.some(
      (item) =>
        item.question.id === questionId ||
        item.children.some((child) => child.question.id === questionId),
    );
  const activeRowId =
    activeQuestionId === null
      ? null
      : hasRow(activeQuestionId)
        ? activeQuestionId
        : findFirstQuestion(
              questionnaire.questions,
              (question) => question.id === activeQuestionId,
            )
          ? questionnaire.questions[
              findTopLevelIndex(questionnaire.questions, activeQuestionId)
            ]?.id
          : null;

  const stateIcon = (question: Question) => {
    if (question.type === "group" || question.type === "display") return null;
    return answeredIds.has(question.id) ? (
      <CheckCheck className="size-4 shrink-0 text-primary-600" />
    ) : (
      <Dot className="size-4 shrink-0 text-gray-500" />
    );
  };

  const row = (item: TreeItem, indent: boolean) => {
    const active = activeRowId === item.question.id;
    return (
      <button
        key={item.question.id}
        type="button"
        aria-current={active ? "true" : undefined}
        // detail 0 = keyboard activation: move focus to the question too,
        // or Enter would scroll the canvas while leaving the user parked
        // inside the overlay.
        onClick={(event) =>
          scrollToQuestion(item.question.id, { focus: event.detail === 0 })
        }
        className={cn(
          "relative flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left text-sm",
          indent ? "min-h-9 px-3" : "min-h-10 pl-2",
          active
            ? "font-semibold text-indigo-600"
            : cn(
                "font-medium hover:bg-gray-100",
                indent ? "text-gray-700" : "text-gray-900",
              ),
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="mr-1">{item.number}</span>
          {item.question.text || (
            <span className="italic text-gray-400">
              {t("untitled_question")}
            </span>
          )}
        </span>
        {/* Decorative completion cue — aria-hidden keeps row accessible
            names (number + title) unchanged. */}
        <span aria-hidden className="flex shrink-0 items-center self-center">
          {stateIcon(item.question)}
        </span>
        {active && (
          <span
            aria-hidden
            className="absolute right-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-indigo-600"
          />
        )}
      </button>
    );
  };

  return (
    <nav aria-label={ariaLabel ?? t("questions")} className="w-full">
      {items.map((item) => {
        // Hidden children drop out too — a row for a question that isn't
        // on the page is a dead end. Numbering stays stable across hides.
        const children = item.children.filter(
          (child) => !hiddenIds.has(child.question.id),
        );
        return (
          <div key={item.question.id} className="py-1">
            {row(item, false)}
            {children.length > 0 && (
              <div className="ml-4 border-l border-gray-300 pl-2">
                {children.map((child) => row(child, true))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

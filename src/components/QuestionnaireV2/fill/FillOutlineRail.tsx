import { cn } from "@/lib/utils";

import {
  useFormRenderer,
  useHiddenQuestionIds,
} from "@/components/QuestionnaireV2/form/FormContext";
import {
  findFirstQuestion,
  findTopLevelIndex,
} from "@/components/QuestionnaireV2/shared/questionTree";

import { useFillOutlineNav } from "./FillOutlineOverlay";

/**
 * One form's tick marks on the outline rail — the collapsed minimap per
 * the reference: one hairline per visible top-level question, the one
 * containing the question currently in view drawn longer and indigo.
 * Purely decorative (the rail button carries the accessible name); lives
 * inside this form's provider to read enable_when visibility, portaled
 * into the shared rail by `FillFormSection`.
 */
export function FillOutlineRail() {
  const { questionnaire } = useFormRenderer();
  const hiddenIds = useHiddenQuestionIds();
  const { activeQuestionId } = useFillOutlineNav();

  const activeTopId =
    activeQuestionId !== null &&
    findFirstQuestion(
      questionnaire.questions,
      (question) => question.id === activeQuestionId,
    )
      ? questionnaire.questions[
          findTopLevelIndex(questionnaire.questions, activeQuestionId)
        ]?.id
      : null;

  return (
    // justify-evenly over the segment's share of the rail height: tick
    // spacing scales with the questionnaire instead of overflowing the
    // fixed-height rail (the host gives each form's segment flex-1).
    <span className="flex min-h-0 w-full flex-1 flex-col justify-evenly">
      {questionnaire.questions
        .filter((question) => !hiddenIds.has(question.id))
        .map((question) => (
          // data-question-tick mirrors the canvas' data-question-id: the
          // stable hook for tests (the ticks are aria-hidden decoration,
          // so no role reaches them).
          <span
            key={question.id}
            data-question-tick={question.id}
            data-active={question.id === activeTopId || undefined}
            className={cn(
              "h-px w-4 bg-gray-400 transition-all duration-200 motion-reduce:transition-none",
              question.id === activeTopId && "w-6 bg-indigo-600",
            )}
          />
        ))}
    </span>
  );
}

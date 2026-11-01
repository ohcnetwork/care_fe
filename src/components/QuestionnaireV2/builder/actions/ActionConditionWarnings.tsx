import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { ActionRule } from "@/components/QuestionnaireV2/shared/actionExpression";

import {
  QuestionVariable,
  questionOfRef,
} from "@/components/QuestionnaireV2/builder/actionVariables";

import { Question } from "@/types/questionnaire/question";

import { questionLabel } from "./labels";

/** Whether a question, or any group above it, is shown conditionally —
 *  then it can be absent from a submission however required it is. */
function isConditional(question: Question, all: Question[]): boolean {
  const path = (list: Question[], trail: Question[]): Question[] | null => {
    for (const candidate of list) {
      const next = [...trail, candidate];
      if (candidate.id === question.id) return next;
      const found = path(candidate.questions ?? [], next);
      if (found) return found;
    }
    return null;
  };
  return (path(all, []) ?? []).some(
    (ancestor) => (ancestor.enable_when?.length ?? 0) > 0,
  );
}

interface ActionConditionWarningsProps {
  rules: ActionRule[];
  questions: QuestionVariable[];
  onMarkRequired: (questionId: string) => void;
}

export function ActionConditionWarnings({
  rules,
  questions,
  onMarkRequired,
}: ActionConditionWarningsProps) {
  const { t } = useTranslation();
  const referenced = rules
    .map((rule) => questionOfRef(rule.ref, questions)?.question)
    .filter((question): question is Question => !!question);
  const allQuestions = questions.map((entry) => entry.question);
  // Answering is what puts `q_<link_id>` into the evaluator's namespace: a
  // referenced question left blank makes the backend raise and the whole
  // submission fail. Optional ones get a warning and a one-click fix;
  // conditionally shown ones cannot be fixed that way — the save rule
  // blocks those, this just says why.
  const conditional: Question[] = [];
  const optional: Question[] = [];
  for (const question of referenced) {
    if (isConditional(question, allQuestions)) conditional.push(question);
    else if (!question.required) optional.push(question);
  }

  return (
    <>
      {conditional.length > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-900">
          <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {t("action_rule_conditional_question", {
            question: conditional.map((q) => questionLabel(q, t)).join(", "),
          })}
        </p>
      )}
      {optional.length > 0 && (
        <div className="space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
          <p className="flex items-start gap-2">
            <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            {t("action_rule_unanswered_hazard", {
              question: optional.map((q) => questionLabel(q, t)).join(", "),
            })}
          </p>
          <div className="flex flex-wrap gap-2 pl-5">
            {optional.map((question) => (
              <Button
                key={question.id}
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 text-amber-900 underline"
                onClick={() => onMarkRequired(question.id)}
              >
                {t("action_mark_required", {
                  question: questionLabel(question, t),
                })}
              </Button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

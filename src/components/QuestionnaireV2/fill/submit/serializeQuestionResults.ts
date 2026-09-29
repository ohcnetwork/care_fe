import {
  buildLinkIndex,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/form/engine/store";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { SubmitResult } from "@/types/questionnaire/questionnaireApi";

import { serializeResponseValues } from "./serializeValues";

/** Repeat rows own their answers; conditions can also read the enclosing scope. */
export function serializeQuestionResults(
  questions: Question[],
  responses: Record<string, QuestionnaireResponse>,
  visit?: (
    question: Question,
    response: QuestionnaireResponse | undefined,
  ) => void,
): SubmitResult[] {
  const index = buildLinkIndex(questions);
  const walk = (
    list: Question[],
    local: Record<string, QuestionnaireResponse>,
    ancestors: Record<string, QuestionnaireResponse>,
  ): SubmitResult[] => {
    const scope = { ...ancestors, ...local };
    return list.flatMap((question): SubmitResult[] => {
      if (!isQuestionEnabledInState(question, scope, index)) return [];
      const response = local[question.id];
      visit?.(question, response);
      if (question.type === "group") {
        if (!question.repeats)
          return walk(question.questions ?? [], local, ancestors);
        const rows = (response?.sub_results ?? [])
          .map((row) =>
            walk(
              question.questions ?? [],
              Object.fromEntries(
                row.map((entry) => [entry.question_id, entry]),
              ),
              scope,
            ),
          )
          .filter((row) => row.length > 0);
        return rows.length
          ? [
              {
                question_id: question.id,
                sub_results: rows,
                note: response?.note,
              },
            ]
          : [];
      }
      if (
        !response ||
        question.type === "structured" ||
        question.type === "display" ||
        response.structured_type
      )
        return [];
      const values = serializeResponseValues(response.values);
      if (!values.length && !response.note) return [];
      return [
        {
          question_id: question.id,
          values,
          note: response.note,
          body_site: response.body_site,
          method: response.method,
          taken_at: response.taken_at,
        },
      ];
    });
  };
  return walk(questions, responses, {});
}

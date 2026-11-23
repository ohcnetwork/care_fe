import {
  buildLinkIndex,
  isQuestionEnabledInState,
} from "@/components/QuestionnaireV2/form/engine/store";

import type {
  QuestionnaireResponse,
  ResponsePath,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { SubmitResult } from "@/types/questionnaire/questionnaireApi";

import { serializeResponseValues } from "./serializeValues";

/** Repeat rows own their answers; conditions read the root response map,
 * matching the renderer and backend. */
export function serializeQuestionResults(
  questions: Question[],
  responses: Record<string, QuestionnaireResponse>,
  visit?: (
    question: Question,
    response: QuestionnaireResponse | undefined,
    path: ResponsePath,
  ) => void,
): SubmitResult[] {
  const index = buildLinkIndex(questions);
  const walk = (
    list: Question[],
    local: Record<string, QuestionnaireResponse>,
    path: ResponsePath,
  ): SubmitResult[] => {
    return list.flatMap((question): SubmitResult[] => {
      if (!isQuestionEnabledInState(question, responses, index)) return [];
      const response = local[question.id];
      visit?.(question, response, path);
      if (question.type === "group") {
        if (!question.repeats)
          return walk(question.questions ?? [], local, path);
        const rows = (response?.sub_results ?? [])
          .map((row, rowIndex) =>
            walk(
              question.questions ?? [],
              Object.fromEntries(
                row.map((entry) => [entry.question_id, entry]),
              ),
              [...path, { questionId: question.id, rowIndex }],
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
  return walk(questions, responses, []);
}

import { serializeQuestionResults } from "@/components/QuestionnaireV2/fill/submit/serializeQuestionResults";
import { findFirstQuestion } from "@/components/QuestionnaireV2/shared/questionTree";

import { ReferralQuestionnaireResult } from "@/types/emr/referral/referral";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import { SubmitResult } from "@/types/questionnaire/questionnaireApi";

export function hasUnsupportedReferralQuestions(
  questions: Question[],
): boolean {
  // Structured clinical questions require domain mutations. Referral forms
  // store answers only; never silently discard or submit those mutations.
  return Boolean(
    findFirstQuestion(questions, (question) => question.type === "structured"),
  );
}

export function referralValueSetSlugs(questions: Question[]): string[] {
  const slugs = new Set<string>();
  const walk = (items: Question[]) => {
    for (const question of items) {
      const config = question.answer_value_set;
      if (config?.slug && !config.external_id) slugs.add(config.slug);
      walk(question.questions ?? []);
    }
  };
  walk(questions);
  return [...slugs];
}

export function pinReferralValueSets(
  questions: Question[],
  instanceValueSetIds: ReadonlyMap<string, string>,
): Question[] {
  return questions.map((question) => {
    const config = question.answer_value_set;
    const resolvedId =
      config?.slug && !config.external_id
        ? instanceValueSetIds.get(config.slug)
        : undefined;
    return {
      ...question,
      answer_value_set: resolvedId
        ? { ...config, external_id: resolvedId }
        : config,
      questions: question.questions
        ? pinReferralValueSets(question.questions, instanceValueSetIds)
        : undefined,
    };
  });
}

function toReferralResult(result: SubmitResult): ReferralQuestionnaireResult {
  return {
    question_id: result.question_id,
    values: (result.values ?? []).map(({ value, unit, coding }) => ({
      value: value === undefined ? undefined : String(value),
      unit,
      coding,
    })),
    note: result.note,
    taken_at: result.taken_at,
    body_site: result.body_site,
    method: result.method,
    sub_results: result.sub_results?.map((row) => row.map(toReferralResult)),
  };
}

export function serializeReferralResponses(
  questions: Question[],
  responses: Record<string, QuestionnaireResponse>,
): ReferralQuestionnaireResult[] {
  // Share V2's visibility, repeated-row, dates, codes and notes-only rules.
  // Its wider public value type is narrowed to the referral API's string wire
  // contract, including values inside repeated group rows.
  return serializeQuestionResults(questions, responses).map(toReferralResult);
}

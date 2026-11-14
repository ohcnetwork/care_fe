import { TFunction } from "i18next";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Small } from "@/components/ui/typography";
import { ReferralQuestionnaireResult } from "@/types/emr/referral/referral";
import { Question } from "@/types/questionnaire/question";

function indexQuestions(questions: Question[]): Map<string, Question> {
  const entries = new Map<string, Question>();
  for (const question of questions) {
    entries.set(question.id, question);
    if (question.questions) {
      for (const [id, child] of indexQuestions(question.questions)) {
        entries.set(id, child);
      }
    }
  }
  return entries;
}

function renderAnswers(
  results: ReferralQuestionnaireResult[],
  questions: Map<string, Question>,
  t: TFunction,
): ReactNode {
  return results.map((result, index) => {
    const question = questions.get(result.question_id);
    const values = (result.values ?? []).map((answer) => {
      let value = answer.coding?.display || answer.coding?.code || answer.value;
      if (question?.type === "boolean" && value != null) {
        value = ["true", "1"].includes(String(value).toLowerCase())
          ? t("yes")
          : t("no");
      }
      if (value == null || value === "") return t("not_specified");
      const option = question?.answer_option?.find(
        (option) => option.value === value,
      );
      const unit = answer.unit?.display || answer.unit?.code;
      return [option?.display || value, unit].filter(Boolean).join(" ");
    });

    return (
      <div key={`${result.question_id}-${index}`} className="space-y-2">
        <Small className="block leading-5 text-muted-foreground">
          {question?.text || t("referral_form_answer")}
        </Small>
        {values.length > 0 && (
          <p className="whitespace-pre-wrap break-words text-sm text-foreground">
            {values.join(", ")}
          </p>
        )}
        {result.note && (
          <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
            {result.note}
          </p>
        )}
        {result.sub_results?.map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="space-y-4 border-l-2 border-border pl-4"
          >
            {renderAnswers(group, questions, t)}
          </div>
        ))}
      </div>
    );
  });
}

export function ReferralQuestionnaireAnswers({
  results,
  questions,
}: {
  results: ReferralQuestionnaireResult[];
  questions: Question[];
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {renderAnswers(results, indexQuestions(questions), t)}
    </div>
  );
}

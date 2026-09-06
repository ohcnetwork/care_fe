import { Fragment, ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Question } from "@/types/questionnaire/question";
import {
  ResourceQuestionnaireAnswer,
  ResourceQuestionnaireResponse,
} from "@/types/questionnaire/resourceQuestionnaireResponseApi";
import { formatResponseValue } from "./response";

interface ResourceResponseDetailsProps {
  response: ResourceQuestionnaireResponse;
}

export default function ResourceResponseDetails({
  response,
}: ResourceResponseDetailsProps) {
  const { t } = useTranslation();

  const renderQuestions = (
    questions: Question[],
    answers: ResourceQuestionnaireAnswer[],
  ): ReactNode[] =>
    questions.flatMap((question) => {
      const answer = answers.find((entry) => entry.question_id === question.id);

      if (question.type === "group") {
        const groups = answer?.sub_results?.length
          ? answer.sub_results
          : [answers];
        return groups.flatMap((groupAnswers, index) => {
          const children = renderQuestions(
            question.questions ?? [],
            groupAnswers,
          );
          if (!children.length) return [];

          return [
            <section
              key={`${question.id}-${index}`}
              className="overflow-hidden rounded-[10px] border border-neutral-200"
            >
              <h4 className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-sm font-semibold text-neutral-900">
                {question.text}
                {groups.length > 1 && ` (${index + 1})`}
              </h4>
              <div className="space-y-5 p-4">{children}</div>
            </section>,
          ];
        });
      }

      if (!answer || question.type === "display") return [];

      const values = (answer.values ?? [])
        .map((value) => formatResponseValue(value, question, t))
        .filter((value) => value !== "");
      if (!values.length && !answer.note) return [];

      return [
        <dl
          key={question.id}
          className="space-y-2 border-b border-neutral-200 pb-5 last:border-0 last:pb-0"
        >
          <dt className="break-words text-sm font-medium leading-5 text-neutral-700">
            {question.text}
          </dt>
          <dd className="min-w-0 space-y-2">
            {values.length > 0 && (
              <p className="break-words whitespace-pre-wrap text-base leading-7 text-neutral-950">
                {values.map((value, index) => (
                  <Fragment key={index}>
                    {index > 0 && ", "}
                    {value}
                  </Fragment>
                ))}
              </p>
            )}
            {answer.note && (
              <p className="rounded-md bg-neutral-50 px-3 py-2 text-sm leading-6 break-words whitespace-pre-wrap text-neutral-600">
                <span className="font-medium">{t("note")}: </span>
                {answer.note}
              </p>
            )}
          </dd>
        </dl>,
      ];
    });

  const questions = renderQuestions(
    response.questionnaire.questions,
    response.responses,
  );

  return (
    <div className="space-y-5">
      {questions.length ? (
        questions
      ) : (
        <p className="py-4 text-sm text-neutral-500">
          {t("no_responses_found")}
        </p>
      )}
    </div>
  );
}

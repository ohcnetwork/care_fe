import type { ReactNode } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { RegisteredGroupAnswerView } from "@/components/QuestionnaireV2/groups/RegisteredGroupAnswerView";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { QuestionnaireResponse as Response } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import { QuestionnaireResponse } from "@/types/questionnaire/questionnaireResponse";
import { formatDateTime, formatName } from "@/Utils/utils";

import { formatValue } from "./QuestionnaireResponsesList";

export function QuestionnaireResponseContent({
  formResponse,
  variant = "default",
}: {
  formResponse: QuestionnaireResponse;
  variant?: "default" | "inline";
}) {
  const Section = variant === "inline" ? "div" : Card;
  const renderQuestion = (
    question: Question,
    responses: Response[],
  ): ReactNode => {
    if (question.type === "structured" || question.type === "display")
      return null;
    if (question.type === "group") {
      const rows = question.repeats
        ? (responses.find((answer) => answer.question_id === question.id)
            ?.sub_results ?? [])
        : [responses];
      return (
        <div key={question.id} className="space-y-4">
          <h3 className="min-w-0 break-words font-medium">{question.text}</h3>
          <RegisteredGroupAnswerView
            question={question}
            responses={responses}
            fallback={
              <div className="grid gap-4">
                {rows.map((row, index) => (
                  <div key={index} className="grid gap-4">
                    {question.repeats && (
                      <h4 className="min-w-0 break-words font-medium">
                        {question.text} ({index + 1})
                      </h4>
                    )}
                    {question.questions?.map((child) =>
                      renderQuestion(child, row),
                    )}
                  </div>
                ))}
              </div>
            }
          />
        </div>
      );
    }

    const questionResponse = responses.find(
      (r: Response) => r.question_id === question.id,
    );
    if (!questionResponse) return null;

    return (
      <div
        key={question.id}
        className="grid min-w-0 gap-2 sm:grid-cols-2 sm:gap-4"
      >
        <div className="text-sm text-gray-500">{question.text}</div>
        <div className="min-w-0 break-words font-medium">
          {(questionResponse.values ?? []).map((entry, index) => (
            <div key={index}>
              {formatValue(entry.value, question.type)}
              {entry.unit && <span className="ml-1">{entry.unit.code}</span>}
              {entry.coding && (
                <span className="ml-1">
                  {entry.coding.display} ({entry.coding.code})
                </span>
              )}
            </div>
          ))}
          {questionResponse.note && (
            <span className="ml-2 text-sm text-gray-500">
              ({questionResponse.note})
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-w-0 space-y-4">
      <Section className={variant === "default" ? "p-3 sm:p-4" : undefined}>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">
              {formResponse.questionnaire?.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CareIcon icon="l-calender" className="size-4" />
              <span>{formatDateTime(formResponse.created_date)}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
              <CareIcon icon="l-user" className="size-4" />
              <span>
                {formatName(formResponse.created_by)}
                {formResponse.created_by?.user_type &&
                  ` (${formResponse.created_by.user_type})`}
              </span>
            </div>
          </div>
        </div>
      </Section>

      {variant === "inline" && <Separator />}
      <Section className={variant === "default" ? "p-3 sm:p-4" : undefined}>
        <div className="space-y-6">
          {formResponse.questionnaire?.questions?.map((question) =>
            renderQuestion(question, formResponse.responses),
          )}
        </div>
      </Section>
    </div>
  );
}

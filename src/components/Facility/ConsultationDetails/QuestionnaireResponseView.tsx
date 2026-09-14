import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import Page from "@/components/Common/Page";
import {
  StructuredAnswerView,
  storedStructuredAnswer,
} from "@/components/QuestionnaireV2/structured/StructuredAnswerView";

import query from "@/Utils/request/query";
import { formatDateTime, formatName } from "@/Utils/utils";
import { QuestionnaireResponse as Response } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";
import questionnaireResponseApi from "@/types/questionnaire/questionnaireResponseApi";

export default function QuestionnaireResponseView({
  responseId,
  patientId,
}: {
  responseId: string;
  patientId: string;
}) {
  const { t } = useTranslation();
  const { data: formResponse, isLoading } = useQuery({
    queryKey: ["getQuestionnaireResponse", patientId, responseId],
    queryFn: query(questionnaireResponseApi.get, {
      pathParams: { patientId, responseId },
    }),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Skeleton className="h-8 w-64" />
      </div>
    );
  }

  if (!formResponse) {
    return (
      <Card className="p-6 text-center">
        <p className="text-lg font-medium text-gray-500">
          {t("error_loading_questionnaire_response")}
        </p>
      </Card>
    );
  }

  const renderLeaf = (question: Question) => {
    if (question.type === "structured") {
      const stored = storedStructuredAnswer(question, formResponse.responses);
      if (!stored) return null;
      return (
        <div key={question.id} className="space-y-1">
          <div className="text-sm text-gray-500">{question.text}</div>
          <StructuredAnswerView
            question={question}
            response={stored}
            patientId={patientId}
          />
        </div>
      );
    }

    const questionResponse = formResponse.responses.find(
      (r: Response) => r.question_id === question.id,
    );
    if (!questionResponse) return null;

    const value = questionResponse.values[0]?.value;

    return (
      <div key={question.id} className="grid grid-cols-2 gap-4">
        <div className="text-sm text-gray-500">{question.text}</div>
        <div className="font-medium">
          {String(value)}
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
    <Page title={formResponse.questionnaire?.title || ""}>
      <div className="space-y-6 p-4">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">
                {formResponse.questionnaire?.description}
              </p>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <CareIcon icon="l-calender" className="size-4" />
                <span>{formatDateTime(formResponse.created_date)}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <CareIcon icon="l-user" className="size-4" />
                <span>
                  {formatName(formResponse.created_by)}
                  {` (${formResponse.created_by?.user_type})`}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="space-y-6">
            {formResponse.questionnaire?.questions.map((question: Question) =>
              question.type === "group" ? (
                <div key={question.id} className="space-y-4">
                  <h3 className="font-medium">{question.text}</h3>
                  <div className="grid gap-4">
                    {question.questions?.map((child: Question) =>
                      renderLeaf(child),
                    )}
                  </div>
                </div>
              ) : (
                // A questionnaire may hold leaves at the top level too (a
                // single structured question, say) — they read like a
                // group of one.
                <div key={question.id} className="grid gap-4">
                  {renderLeaf(question)}
                </div>
              ),
            )}
          </div>
        </Card>
      </div>
    </Page>
  );
}

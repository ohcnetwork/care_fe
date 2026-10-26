import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { QuestionnaireResponseContent } from "./QuestionnaireResponseContent";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
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

  return (
    <Page title={formResponse.questionnaire?.title || ""}>
      <QuestionnaireResponseContent formResponse={formResponse} />
    </Page>
  );
}

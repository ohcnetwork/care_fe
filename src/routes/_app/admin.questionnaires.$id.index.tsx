import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireDetailPage } from "@/components/QuestionnaireV2/manage/QuestionnaireDetailPage";
import { questionnaireShowSearch } from "@/lib/router/search/admin";

import { INSTANCE_QUESTIONNAIRE_SCOPE } from "./-adminQuestionnaireScope";

export const Route = createFileRoute("/_app/admin/questionnaires/$id/")({
  validateSearch: questionnaireShowSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/admin/questionnaires/$id/" });
  return (
    <QuestionnaireDetailPage scope={INSTANCE_QUESTIONNAIRE_SCOPE} id={id} />
  );
}

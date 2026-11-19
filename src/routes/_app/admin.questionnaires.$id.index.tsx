import { createFileRoute } from "@tanstack/react-router";

import { QuestionnaireDetailPage } from "@/components/QuestionnaireV2/manage/QuestionnaireDetailPage";

import { INSTANCE_QUESTIONNAIRE_SCOPE } from "./-adminQuestionnaireScope";

export const Route = createFileRoute("/_app/admin/questionnaires/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return (
    <QuestionnaireDetailPage scope={INSTANCE_QUESTIONNAIRE_SCOPE} id={id} />
  );
}

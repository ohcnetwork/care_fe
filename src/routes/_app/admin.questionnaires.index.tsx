import { createFileRoute } from "@tanstack/react-router";

import { QuestionnaireListPage } from "@/components/QuestionnaireV2/manage/QuestionnaireListPage";

import { INSTANCE_QUESTIONNAIRE_SCOPE } from "./-adminQuestionnaireScope";

export const Route = createFileRoute("/_app/admin/questionnaires/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <QuestionnaireListPage scope={INSTANCE_QUESTIONNAIRE_SCOPE} />;
}

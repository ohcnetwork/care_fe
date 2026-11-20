import { createFileRoute } from "@tanstack/react-router";

import { QuestionnaireCreatePage } from "@/components/QuestionnaireV2/manage/QuestionnaireCreatePage";

import { INSTANCE_QUESTIONNAIRE_SCOPE } from "./-adminQuestionnaireScope";

export const Route = createFileRoute("/_app/admin/questionnaires/new")({
  component: RouteComponent,
});

function RouteComponent() {
  return <QuestionnaireCreatePage scope={INSTANCE_QUESTIONNAIRE_SCOPE} />;
}

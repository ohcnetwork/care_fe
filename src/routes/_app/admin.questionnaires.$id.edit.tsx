import { createFileRoute } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";

import { QuestionnaireStudioPage } from "@/components/QuestionnaireV2/studio/QuestionnaireStudioPage";

import { INSTANCE_QUESTIONNAIRE_SCOPE } from "./-adminQuestionnaireScope";

/** Questionnaire studio (full-screen builder). */
export const Route = createFileRoute("/_app/admin/questionnaires/$id/edit")({
  component: RouteComponent,
  staticData: fullScreenPage,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return (
    <QuestionnaireStudioPage scope={INSTANCE_QUESTIONNAIRE_SCOPE} id={id} />
  );
}

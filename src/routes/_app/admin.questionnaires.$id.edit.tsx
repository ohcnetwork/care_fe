import { createFileRoute, useParams } from "@tanstack/react-router";

import { questionnaireStudioSearch } from "@/lib/router/search/admin";
import { fullScreenPage } from "@/lib/router/staticData";

import { QuestionnaireStudioPage } from "@/components/QuestionnaireV2/studio/QuestionnaireStudioPage";

import { INSTANCE_QUESTIONNAIRE_SCOPE } from "./-adminQuestionnaireScope";

/** Questionnaire studio (full-screen builder). */
export const Route = createFileRoute("/_app/admin/questionnaires/$id/edit")({
  validateSearch: questionnaireStudioSearch,
  component: RouteComponent,
  staticData: fullScreenPage,
});

function RouteComponent() {
  const { id } = useParams({ from: "/_app/admin/questionnaires/$id/edit" });
  return (
    <QuestionnaireStudioPage scope={INSTANCE_QUESTIONNAIRE_SCOPE} id={id} />
  );
}

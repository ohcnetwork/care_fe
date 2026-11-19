import { createFileRoute } from "@tanstack/react-router";

import { QuestionnaireStudioPage } from "@/components/QuestionnaireV2/studio/QuestionnaireStudioPage";
import { questionnaireScope } from "@/pages/Facility/settings/questionnaireScope";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/questionnaires/$id/edit",
)({
  component: RouteComponent,
  staticData: { sidebar: false },
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return (
    <QuestionnaireStudioPage scope={questionnaireScope(facilityId)} id={id} />
  );
}

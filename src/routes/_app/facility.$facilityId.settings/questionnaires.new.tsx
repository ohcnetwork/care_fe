import { createFileRoute } from "@tanstack/react-router";

import { QuestionnaireCreatePage } from "@/components/QuestionnaireV2/manage/QuestionnaireCreatePage";
import { questionnaireScope } from "@/pages/Facility/settings/questionnaireScope";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/questionnaires/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <QuestionnaireCreatePage scope={questionnaireScope(facilityId)} />;
}

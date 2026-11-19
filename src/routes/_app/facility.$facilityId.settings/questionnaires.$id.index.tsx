import { createFileRoute } from "@tanstack/react-router";

import { QuestionnaireDetailPage } from "@/components/QuestionnaireV2/manage/QuestionnaireDetailPage";
import { questionnaireScope } from "@/pages/Facility/settings/questionnaireScope";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/questionnaires/$id/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return (
    <QuestionnaireDetailPage scope={questionnaireScope(facilityId)} id={id} />
  );
}

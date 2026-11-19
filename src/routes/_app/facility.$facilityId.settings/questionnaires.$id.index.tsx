import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireDetailPage } from "@/components/QuestionnaireV2/manage/QuestionnaireDetailPage";
import { questionnaireScope } from "@/pages/Facility/settings/questionnaireScope";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/questionnaires/$id/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/questionnaires/$id/",
  });
  return (
    <QuestionnaireDetailPage scope={questionnaireScope(facilityId)} id={id} />
  );
}

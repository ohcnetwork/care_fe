import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireListPage } from "@/components/QuestionnaireV2/manage/QuestionnaireListPage";
import { questionnaireScope } from "@/pages/Facility/settings/questionnaireScope";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/questionnaires/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/questionnaires/",
  });
  return <QuestionnaireListPage scope={questionnaireScope(facilityId)} />;
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireCreatePage } from "@/components/QuestionnaireV2/manage/QuestionnaireCreatePage";
import { questionnaireScope } from "@/pages/Facility/settings/questionnaireScope";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/questionnaires/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/questionnaires/new",
  });
  return <QuestionnaireCreatePage scope={questionnaireScope(facilityId)} />;
}

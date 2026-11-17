import { createFileRoute } from "@tanstack/react-router";

import { QuestionnaireRevisionPage } from "@/components/QuestionnaireV2/manage/QuestionnaireRevisionPage";
import { questionnaireScope } from "@/pages/Facility/settings/questionnaireScope";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/questionnaires/$id/versions/$revisionId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id, revisionId } = Route.useParams();
  return (
    <QuestionnaireRevisionPage
      scope={questionnaireScope(facilityId)}
      id={id}
      revisionId={revisionId}
    />
  );
}

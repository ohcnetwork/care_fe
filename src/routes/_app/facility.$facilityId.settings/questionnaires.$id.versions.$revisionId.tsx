import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireRevisionPage } from "@/components/QuestionnaireV2/manage/QuestionnaireRevisionPage";
import { questionnaireScope } from "@/pages/Facility/settings/questionnaireScope";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/questionnaires/$id/versions/$revisionId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id, revisionId } = useParams({
    from: "/_app/facility/$facilityId/settings/questionnaires/$id/versions/$revisionId",
  });
  return (
    <QuestionnaireRevisionPage
      scope={questionnaireScope(facilityId)}
      id={id}
      revisionId={revisionId}
    />
  );
}

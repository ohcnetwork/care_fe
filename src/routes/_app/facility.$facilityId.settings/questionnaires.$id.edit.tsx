import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireStudioPage } from "@/components/QuestionnaireV2/studio/QuestionnaireStudioPage";
import { questionnaireStudioSearch } from "@/lib/router/search/admin";
import { questionnaireScope } from "@/pages/Facility/settings/questionnaireScope";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/questionnaires/$id/edit",
)({
  validateSearch: questionnaireStudioSearch,
  component: RouteComponent,
  staticData: { sidebar: false },
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/questionnaires/$id/edit",
  });
  return (
    <QuestionnaireStudioPage scope={questionnaireScope(facilityId)} id={id} />
  );
}

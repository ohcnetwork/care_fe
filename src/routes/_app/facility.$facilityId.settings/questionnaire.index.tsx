import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/questionnaire/",
)({
  component: RouteComponent,
  staticData: { sidebar: false },
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/questionnaire/",
  });
  return <QuestionnaireFillPage subject={{ type: "facility", facilityId }} />;
}

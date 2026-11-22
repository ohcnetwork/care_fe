import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";
import { questionnaireFillSearch } from "@/lib/router/search/questionnaire";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/questionnaire/",
)({
  validateSearch: questionnaireFillSearch,
  component: RouteComponent,
  staticData: { sidebar: false },
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/questionnaire/",
  });
  return <QuestionnaireFillPage subject={{ type: "facility", facilityId }} />;
}

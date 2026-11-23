import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";
import { questionnaireFillSearch } from "@/lib/router/search/questionnaire";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/devices/$id/questionnaire/",
)({
  validateSearch: questionnaireFillSearch,
  component: RouteComponent,
  staticData: { sidebar: false },
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/devices/$id/questionnaire/",
  });
  return (
    <QuestionnaireFillPage
      subject={{ type: "device", facilityId, deviceId: id }}
    />
  );
}

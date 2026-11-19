import { createFileRoute } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/devices/$id/questionnaire/",
)({
  component: RouteComponent,
  staticData: { sidebar: false },
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return (
    <QuestionnaireFillPage
      subject={{ type: "device", facilityId, deviceId: id }}
    />
  );
}

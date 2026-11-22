import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";
import { questionnaireFillSearch } from "@/lib/router/search/questionnaire";
import { questionnaireFillPage } from "@/lib/router/staticData";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/questionnaire/$questionnaireId",
)({
  validateSearch: questionnaireFillSearch,
  component: RouteComponent,
  staticData: questionnaireFillPage,
});

function RouteComponent() {
  const { facilityId, locationId, questionnaireId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/questionnaire/$questionnaireId",
  });
  return (
    <QuestionnaireFillPage
      subject={{ type: "location", facilityId, locationId }}
      questionnaireId={questionnaireId}
    />
  );
}

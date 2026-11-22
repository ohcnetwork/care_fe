import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";
import { questionnaireFillSearch } from "@/lib/router/search/questionnaire";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/questionnaire/$questionnaireId",
)({
  validateSearch: questionnaireFillSearch,
  component: RouteComponent,
  staticData: { sidebar: false },
});

function RouteComponent() {
  const { facilityId, questionnaireId } = useParams({
    from: "/_app/facility/$facilityId/settings/questionnaire/$questionnaireId",
  });
  return (
    <QuestionnaireFillPage
      subject={{ type: "facility", facilityId }}
      questionnaireId={questionnaireId}
    />
  );
}

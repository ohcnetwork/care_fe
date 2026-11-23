import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

import { questionnaireFillSearch } from "@/lib/router/search/questionnaire";
import { questionnaireFillPage } from "@/lib/router/staticData";

// An index route: a `questionnaire.tsx` file would become the parent of the
// print routes and give them its layout flags.
export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/questionnaire/",
)({
  validateSearch: questionnaireFillSearch,
  component: RouteComponent,
  staticData: questionnaireFillPage,
});

function RouteComponent() {
  const { facilityId, patientId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/questionnaire/",
  });
  return (
    <QuestionnaireFillPage
      subject={{ type: "patient", facilityId, patientId }}
    />
  );
}

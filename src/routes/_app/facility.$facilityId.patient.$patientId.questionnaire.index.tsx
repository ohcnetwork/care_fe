import { createFileRoute } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

import { questionnaireFillPage } from "@/lib/router/staticData";

// An index route: a `questionnaire.tsx` file would become the parent of the
// print routes and give them its layout flags.
export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/questionnaire/",
)({
  component: RouteComponent,
  staticData: questionnaireFillPage,
});

function RouteComponent() {
  const { facilityId, patientId } = Route.useParams();
  return (
    <QuestionnaireFillPage
      subject={{ type: "patient", facilityId, patientId }}
    />
  );
}

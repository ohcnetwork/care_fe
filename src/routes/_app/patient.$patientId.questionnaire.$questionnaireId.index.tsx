import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

import { questionnaireFillSearch } from "@/lib/router/search/questionnaire";
import { questionnaireFillPage } from "@/lib/router/staticData";

/** Staff only, on purpose: a patient session on this URL goes to the sign-in. */
export const Route = createFileRoute(
  "/_app/patient/$patientId/questionnaire/$questionnaireId/",
)({
  validateSearch: questionnaireFillSearch,
  component: RouteComponent,
  staticData: questionnaireFillPage,
});

function RouteComponent() {
  const { patientId, questionnaireId } = useParams({
    from: "/_app/patient/$patientId/questionnaire/$questionnaireId/",
  });
  return (
    <QuestionnaireFillPage
      subject={{ type: "patient", patientId }}
      questionnaireId={questionnaireId}
    />
  );
}

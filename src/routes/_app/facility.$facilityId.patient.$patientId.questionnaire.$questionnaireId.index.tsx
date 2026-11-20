import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

import {
  isQuestionnaireId,
  questionnaireQuery,
  startQuery,
} from "@/lib/router/pageQueries";
import { questionnaireFillPage } from "@/lib/router/staticData";

// The patient-subject picker needs an id route to land on. The old form
// added the picked questionnaires in the session instead of navigating.
export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/questionnaire/$questionnaireId/",
)({
  loader: ({ context, params: { questionnaireId } }) => {
    if (isQuestionnaireId(questionnaireId)) {
      startQuery(context, questionnaireQuery(questionnaireId));
    }
  },
  component: RouteComponent,
  staticData: questionnaireFillPage,
});

function RouteComponent() {
  const { facilityId, patientId, questionnaireId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/questionnaire/$questionnaireId/",
  });
  return (
    <QuestionnaireFillPage
      subject={{ type: "patient", facilityId, patientId }}
      questionnaireId={questionnaireId}
    />
  );
}

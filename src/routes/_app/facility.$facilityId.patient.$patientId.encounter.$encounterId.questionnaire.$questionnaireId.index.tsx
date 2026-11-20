import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

import {
  encounterQuery,
  isQuestionnaireId,
  questionnaireQuery,
  startQuery,
} from "@/lib/router/pageQueries";
import { questionnaireFillPage } from "@/lib/router/staticData";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/questionnaire/$questionnaireId/",
)({
  loader: ({ context, params }) => {
    const { facilityId, patientId, encounterId, questionnaireId } = params;
    if (isQuestionnaireId(questionnaireId)) {
      startQuery(context, questionnaireQuery(questionnaireId));
    }
    startQuery(context, encounterQuery(encounterId, { facilityId, patientId }));
  },
  component: RouteComponent,
  staticData: questionnaireFillPage,
});

function RouteComponent() {
  const { facilityId, patientId, encounterId, questionnaireId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/questionnaire/$questionnaireId/",
  });
  return (
    <QuestionnaireFillPage
      subject={{ type: "encounter", facilityId, patientId, encounterId }}
      questionnaireId={questionnaireId}
    />
  );
}

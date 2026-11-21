import { createFileRoute, useParams } from "@tanstack/react-router";

import { QuestionnaireFillPage } from "@/components/QuestionnaireV2/fill/QuestionnaireFillPage";

import { questionnaireFillPage } from "@/lib/router/staticData";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/questionnaire/$questionnaireId/",
)({
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

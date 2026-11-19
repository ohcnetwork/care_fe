import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintAllQuestionnaireResponses } from "@/components/Facility/ConsultationDetails/PrintAllQuestionnaireResponses";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/questionnaire/$questionnaireId/responses/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, encounterId, questionnaireId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/questionnaire/$questionnaireId/responses/print",
  });
  return (
    <PrintAllQuestionnaireResponses
      encounterId={encounterId}
      patientId={patientId}
      questionnaireId={questionnaireId}
      facilityId={facilityId}
    />
  );
}

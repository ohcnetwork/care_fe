import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintQuestionnaireResponse } from "@/components/Facility/ConsultationDetails/PrintQuestionnaireResponse";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/questionnaire_response/$questionnaireResponseId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, encounterId, questionnaireResponseId } =
    useParams({
      from: "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/questionnaire_response/$questionnaireResponseId/print",
    });
  return (
    <PrintQuestionnaireResponse
      encounterId={encounterId}
      patientId={patientId}
      questionnaireResponseId={questionnaireResponseId}
      facilityId={facilityId}
    />
  );
}

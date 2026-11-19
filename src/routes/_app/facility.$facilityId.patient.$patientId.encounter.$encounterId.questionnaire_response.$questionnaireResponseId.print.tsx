import { createFileRoute } from "@tanstack/react-router";

import { PrintQuestionnaireResponse } from "@/components/Facility/ConsultationDetails/PrintQuestionnaireResponse";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/questionnaire_response/$questionnaireResponseId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, encounterId, questionnaireResponseId } =
    Route.useParams();
  return (
    <PrintQuestionnaireResponse
      encounterId={encounterId}
      patientId={patientId}
      questionnaireResponseId={questionnaireResponseId}
      facilityId={facilityId}
    />
  );
}

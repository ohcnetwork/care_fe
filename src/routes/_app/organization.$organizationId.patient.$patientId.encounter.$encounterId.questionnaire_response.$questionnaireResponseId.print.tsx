import { createFileRoute } from "@tanstack/react-router";

import { PrintQuestionnaireResponse } from "@/components/Facility/ConsultationDetails/PrintQuestionnaireResponse";

export const Route = createFileRoute(
  "/_app/organization/$organizationId/patient/$patientId/encounter/$encounterId/questionnaire_response/$questionnaireResponseId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, encounterId, questionnaireResponseId } = Route.useParams();
  return (
    <PrintQuestionnaireResponse
      encounterId={encounterId}
      patientId={patientId}
      questionnaireResponseId={questionnaireResponseId}
    />
  );
}

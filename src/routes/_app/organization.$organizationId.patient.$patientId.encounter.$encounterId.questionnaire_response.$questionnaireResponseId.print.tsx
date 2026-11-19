import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintQuestionnaireResponse } from "@/components/Facility/ConsultationDetails/PrintQuestionnaireResponse";

export const Route = createFileRoute(
  "/_app/organization/$organizationId/patient/$patientId/encounter/$encounterId/questionnaire_response/$questionnaireResponseId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, encounterId, questionnaireResponseId } = useParams({
    from: "/_app/organization/$organizationId/patient/$patientId/encounter/$encounterId/questionnaire_response/$questionnaireResponseId/print",
  });
  return (
    <PrintQuestionnaireResponse
      encounterId={encounterId}
      patientId={patientId}
      questionnaireResponseId={questionnaireResponseId}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { PrintQuestionnaireResponse } from "@/components/Facility/ConsultationDetails/PrintQuestionnaireResponse";

export const Route = createFileRoute(
  "/_app/organization/$organizationId/patient/$patientId/questionnaire_response/$questionnaireResponseId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, questionnaireResponseId } = Route.useParams();
  return (
    <PrintQuestionnaireResponse
      patientId={patientId}
      questionnaireResponseId={questionnaireResponseId}
    />
  );
}

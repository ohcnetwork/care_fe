import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintQuestionnaireResponse } from "@/components/Facility/ConsultationDetails/PrintQuestionnaireResponse";

export const Route = createFileRoute(
  "/_app/patient/$patientId/history/questionnaire_response/$questionnaireResponseId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, questionnaireResponseId } = useParams({
    from: "/_app/patient/$patientId/history/questionnaire_response/$questionnaireResponseId/print",
  });
  return (
    <PrintQuestionnaireResponse
      patientId={patientId}
      questionnaireResponseId={questionnaireResponseId}
    />
  );
}

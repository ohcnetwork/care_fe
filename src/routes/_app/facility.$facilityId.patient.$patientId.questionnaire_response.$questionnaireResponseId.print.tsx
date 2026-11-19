import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintQuestionnaireResponse } from "@/components/Facility/ConsultationDetails/PrintQuestionnaireResponse";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/questionnaire_response/$questionnaireResponseId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, questionnaireResponseId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/questionnaire_response/$questionnaireResponseId/print",
  });
  return (
    <PrintQuestionnaireResponse
      patientId={patientId}
      questionnaireResponseId={questionnaireResponseId}
      facilityId={facilityId}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { PrintAllQuestionnaireResponses } from "@/components/Facility/ConsultationDetails/PrintAllQuestionnaireResponses";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/history/questionnaire/$questionnaireId/responses/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, questionnaireId } = Route.useParams();
  return (
    <PrintAllQuestionnaireResponses
      patientId={patientId}
      questionnaireId={questionnaireId}
      facilityId={facilityId}
    />
  );
}

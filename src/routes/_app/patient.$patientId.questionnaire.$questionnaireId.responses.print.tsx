import { createFileRoute } from "@tanstack/react-router";

import { PrintAllQuestionnaireResponses } from "@/components/Facility/ConsultationDetails/PrintAllQuestionnaireResponses";

export const Route = createFileRoute(
  "/_app/patient/$patientId/questionnaire/$questionnaireId/responses/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, questionnaireId } = Route.useParams();
  return (
    <PrintAllQuestionnaireResponses
      patientId={patientId}
      questionnaireId={questionnaireId}
    />
  );
}

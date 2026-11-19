import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintAllQuestionnaireResponses } from "@/components/Facility/ConsultationDetails/PrintAllQuestionnaireResponses";

export const Route = createFileRoute(
  "/_app/patient/$patientId/questionnaire/$questionnaireId/responses/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, questionnaireId } = useParams({
    from: "/_app/patient/$patientId/questionnaire/$questionnaireId/responses/print",
  });
  return (
    <PrintAllQuestionnaireResponses
      patientId={patientId}
      questionnaireId={questionnaireId}
    />
  );
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import QuestionnaireResponseView from "@/components/Facility/ConsultationDetails/QuestionnaireResponseView";

// An index route: it must not become the parent of the print route.
export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/questionnaire_response/$questionnaireResponseId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, questionnaireResponseId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/questionnaire_response/$questionnaireResponseId/",
  });
  return (
    <QuestionnaireResponseView
      responseId={questionnaireResponseId}
      patientId={patientId}
    />
  );
}

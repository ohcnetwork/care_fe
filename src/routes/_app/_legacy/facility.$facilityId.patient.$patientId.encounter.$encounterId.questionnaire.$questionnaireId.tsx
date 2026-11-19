import { createFileRoute } from "@tanstack/react-router";

import { questionnaireFillPage } from "@/lib/router/staticData";

export const Route = createFileRoute(
  "/_app/_legacy/facility/$facilityId/patient/$patientId/encounter/$encounterId/questionnaire/$questionnaireId",
)({ staticData: questionnaireFillPage });

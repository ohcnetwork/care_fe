import { createFileRoute } from "@tanstack/react-router";

import { questionnaireFillPage } from "@/lib/router/staticData";

export const Route = createFileRoute(
  "/_app/_legacy/patient/$patientId/questionnaire/$questionnaireId",
)({ staticData: questionnaireFillPage });

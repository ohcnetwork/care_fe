import { createFileRoute } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";

/** Encounter tabs give the full width to the chart and carry their own back button. */
export const Route = createFileRoute(
  "/_app/_legacy/organization/$organizationId/patient/$patientId/encounter/$encounterId/$tab",
)({ staticData: fullScreenPage });

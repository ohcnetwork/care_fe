import { createFileRoute } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";

/** Pharmacy dispense. */
export const Route = createFileRoute(
  "/_app/_legacy/facility/$facilityId/locations/$locationId/medication_requests/patient/$patientId/bill/dispense/$encounterId",
)({ staticData: fullScreenPage });

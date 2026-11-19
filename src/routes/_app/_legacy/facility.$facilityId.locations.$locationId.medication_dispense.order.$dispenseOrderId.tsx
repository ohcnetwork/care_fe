import { createFileRoute } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";

/** Dispense order. */
export const Route = createFileRoute(
  "/_app/_legacy/facility/$facilityId/locations/$locationId/medication_dispense/order/$dispenseOrderId",
)({ staticData: fullScreenPage });

import { createFileRoute } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";

export const Route = createFileRoute(
  "/_app/_legacy/facility/$facilityId/locations/$locationId/service_requests/$serviceRequestId",
)({ staticData: fullScreenPage });

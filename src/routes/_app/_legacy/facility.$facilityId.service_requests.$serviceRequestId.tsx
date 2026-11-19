import { createFileRoute } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";

export const Route = createFileRoute(
  "/_app/_legacy/facility/$facilityId/service_requests/$serviceRequestId",
)({ staticData: fullScreenPage });

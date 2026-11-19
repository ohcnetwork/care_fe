import { createFileRoute } from "@tanstack/react-router";

/** Service workspace: inner sidebar. */
export const Route = createFileRoute(
  "/_app/_legacy/facility/$facilityId/services/$serviceId",
)({ staticData: { workspace: "service" } });

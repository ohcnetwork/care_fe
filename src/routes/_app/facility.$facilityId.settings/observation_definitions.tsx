import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/observation_definitions",
)({
  staticData: { crumb: "observation_definitions" },
});

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/activity_definitions",
)({
  staticData: { crumb: "activity_definitions" },
});

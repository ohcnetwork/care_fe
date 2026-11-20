import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/specimen_definitions",
)({
  staticData: { crumb: "specimen_definitions" },
});

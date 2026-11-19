import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/locations",
)({
  staticData: { crumb: "locations" },
});

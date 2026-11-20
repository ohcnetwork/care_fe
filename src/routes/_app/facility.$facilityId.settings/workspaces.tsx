import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/workspaces",
)({
  staticData: { crumb: "workspaces" },
});

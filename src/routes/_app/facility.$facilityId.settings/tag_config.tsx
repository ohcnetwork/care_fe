import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/tag_config",
)({
  staticData: { crumb: "tag_config" },
});

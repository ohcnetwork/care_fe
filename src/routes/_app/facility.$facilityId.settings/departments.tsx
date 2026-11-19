import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/departments",
)({
  staticData: { crumb: "departments" },
});

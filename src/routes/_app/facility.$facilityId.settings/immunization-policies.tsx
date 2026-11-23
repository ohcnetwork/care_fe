import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/immunization-policies",
)({
  staticData: { crumb: "immunization_policies" },
});

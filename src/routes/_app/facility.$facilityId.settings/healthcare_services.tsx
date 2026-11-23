import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/healthcare_services",
)({
  staticData: { crumb: "healthcare_services" },
});

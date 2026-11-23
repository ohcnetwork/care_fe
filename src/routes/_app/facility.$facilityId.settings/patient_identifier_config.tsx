import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/patient_identifier_config",
)({
  staticData: { crumb: "patient_identifier_config" },
});

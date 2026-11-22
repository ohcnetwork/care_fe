import { createFileRoute } from "@tanstack/react-router";

import { InformationalCodeSettings } from "@/pages/Facility/settings/billing/informational/InformationalCodeSettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/billing/informational_codes",
)({
  component: InformationalCodeSettings,
  staticData: { crumb: "informational_codes" },
});

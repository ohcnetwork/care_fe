import { createFileRoute } from "@tanstack/react-router";

import { BillingSettings } from "@/pages/Facility/settings/billing/settings/BillingSettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/billing/settings",
)({
  component: BillingSettings,
  staticData: { crumb: "settings" },
});

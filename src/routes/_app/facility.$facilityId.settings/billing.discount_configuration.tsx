import { createFileRoute } from "@tanstack/react-router";

import { DiscountConfigurationSettings } from "@/pages/Facility/settings/billing/discount/discount-configuration/DiscountConfigurationSettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/billing/discount_configuration",
)({
  component: DiscountConfigurationSettings,
  staticData: { crumb: "discount_configuration" },
});

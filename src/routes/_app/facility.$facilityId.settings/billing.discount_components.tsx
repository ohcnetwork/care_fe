import { createFileRoute } from "@tanstack/react-router";

import { DiscountComponentSettings } from "@/pages/Facility/settings/billing/discount/discount-components/DiscountComponentSettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/billing/discount_components",
)({
  component: DiscountComponentSettings,
  staticData: { crumb: "discount_components" },
});

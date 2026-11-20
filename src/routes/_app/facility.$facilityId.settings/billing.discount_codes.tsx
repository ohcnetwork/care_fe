import { createFileRoute } from "@tanstack/react-router";

import { DiscountCodeSettings } from "@/pages/Facility/settings/billing/discount/discount-codes/DiscountCodeSettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/billing/discount_codes",
)({
  component: DiscountCodeSettings,
  staticData: { crumb: "discount_codes" },
});

import { createFileRoute } from "@tanstack/react-router";

import { TaxCodeSettings } from "@/pages/Facility/settings/billing/tax/tax-codes/TaxCodeSettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/billing/tax_codes",
)({
  component: TaxCodeSettings,
  staticData: { crumb: "tax_codes" },
});

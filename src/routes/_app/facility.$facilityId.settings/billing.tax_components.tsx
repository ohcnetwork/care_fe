import { createFileRoute } from "@tanstack/react-router";

import { TaxComponentSettings } from "@/pages/Facility/settings/billing/tax/tax-components/TaxComponentSettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/billing/tax_components",
)({
  component: TaxComponentSettings,
  staticData: { crumb: "tax_components" },
});

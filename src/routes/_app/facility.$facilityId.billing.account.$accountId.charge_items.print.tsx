import { createFileRoute, useParams } from "@tanstack/react-router";

import { chargeItemPrintSearch } from "@/lib/router/search/billing";
import { PrintChargeItems } from "@/pages/Facility/billing/account/components/PrintChargeItems";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/$accountId/charge_items/print",
)({
  validateSearch: chargeItemPrintSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, accountId } = useParams({
    from: "/_app/facility/$facilityId/billing/account/$accountId/charge_items/print",
  });
  return <PrintChargeItems facilityId={facilityId} accountId={accountId} />;
}

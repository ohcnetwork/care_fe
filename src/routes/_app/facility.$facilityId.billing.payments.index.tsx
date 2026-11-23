import { createFileRoute, useParams } from "@tanstack/react-router";

import { paymentsPageSearch } from "@/lib/router/search/billing";
import PaymentReconciliationList from "@/pages/Facility/billing/paymentReconciliation/PaymentReconciliationList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/payments/",
)({
  validateSearch: paymentsPageSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/billing/payments/",
  });
  return <PaymentReconciliationList facilityId={facilityId} />;
}

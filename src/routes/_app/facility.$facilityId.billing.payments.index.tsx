import { createFileRoute, useParams } from "@tanstack/react-router";

import PaymentReconciliationList from "@/pages/Facility/billing/paymentReconciliation/PaymentReconciliationList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/payments/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/billing/payments/",
  });
  return <PaymentReconciliationList facilityId={facilityId} />;
}

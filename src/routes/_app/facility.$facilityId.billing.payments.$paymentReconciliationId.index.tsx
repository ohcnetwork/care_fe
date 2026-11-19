import { createFileRoute, useParams } from "@tanstack/react-router";

import PaymentReconciliationShow from "@/pages/Facility/billing/paymentReconciliation/PaymentReconciliationShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/payments/$paymentReconciliationId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, paymentReconciliationId } = useParams({
    from: "/_app/facility/$facilityId/billing/payments/$paymentReconciliationId/",
  });
  return (
    <PaymentReconciliationShow
      facilityId={facilityId}
      paymentReconciliationId={paymentReconciliationId}
    />
  );
}

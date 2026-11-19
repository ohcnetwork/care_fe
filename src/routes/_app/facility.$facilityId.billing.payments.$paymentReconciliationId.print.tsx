import { createFileRoute } from "@tanstack/react-router";

import PrintPaymentReconciliation from "@/pages/Facility/billing/paymentReconciliation/PrintPaymentReconciliation";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/payments/$paymentReconciliationId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, paymentReconciliationId } = Route.useParams();
  return (
    <PrintPaymentReconciliation
      facilityId={facilityId}
      paymentReconciliationId={paymentReconciliationId}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";

import PaymentReconciliationList from "@/pages/Facility/billing/paymentReconciliation/PaymentReconciliationList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/payments/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <PaymentReconciliationList facilityId={facilityId} />;
}

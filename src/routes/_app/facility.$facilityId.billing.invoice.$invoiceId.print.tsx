import { createFileRoute } from "@tanstack/react-router";

import PrintInvoice from "@/pages/Facility/billing/invoice/PrintInvoice";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/invoice/$invoiceId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, invoiceId } = Route.useParams();
  return <PrintInvoice facilityId={facilityId} invoiceId={invoiceId} />;
}

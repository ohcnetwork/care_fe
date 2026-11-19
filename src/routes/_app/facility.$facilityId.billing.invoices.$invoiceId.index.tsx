import { createFileRoute } from "@tanstack/react-router";

import InvoiceShow from "@/pages/Facility/billing/invoice/InvoiceShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/invoices/$invoiceId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, invoiceId } = Route.useParams();
  return <InvoiceShow facilityId={facilityId} invoiceId={invoiceId} />;
}

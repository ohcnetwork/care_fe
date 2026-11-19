import { createFileRoute } from "@tanstack/react-router";

import PrintInvoices from "@/pages/Facility/billing/invoice/PrintInvoices";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/invoices/$invoiceIds/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, invoiceIds } = Route.useParams();
  return <PrintInvoices facilityId={facilityId} invoiceIds={invoiceIds} />;
}

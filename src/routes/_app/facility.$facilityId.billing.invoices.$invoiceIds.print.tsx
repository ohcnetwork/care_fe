import { createFileRoute, useParams } from "@tanstack/react-router";

import PrintInvoices from "@/pages/Facility/billing/invoice/PrintInvoices";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/invoices/$invoiceIds/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, invoiceIds } = useParams({
    from: "/_app/facility/$facilityId/billing/invoices/$invoiceIds/print",
  });
  return <PrintInvoices facilityId={facilityId} invoiceIds={invoiceIds} />;
}

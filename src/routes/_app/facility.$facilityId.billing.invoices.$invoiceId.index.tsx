import { createFileRoute, useParams } from "@tanstack/react-router";

import { invoiceShowSearch } from "@/lib/router/search/billing";
import InvoiceShow from "@/pages/Facility/billing/invoice/InvoiceShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/invoices/$invoiceId/",
)({
  validateSearch: invoiceShowSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, invoiceId } = useParams({
    from: "/_app/facility/$facilityId/billing/invoices/$invoiceId/",
  });
  return <InvoiceShow facilityId={facilityId} invoiceId={invoiceId} />;
}

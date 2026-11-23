import { createFileRoute, useParams } from "@tanstack/react-router";

import { invoiceListSearch } from "@/lib/router/search/billing";
import InvoiceList from "@/pages/Facility/billing/invoice/InvoiceList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/invoices/",
)({
  validateSearch: invoiceListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/billing/invoices/",
  });
  return <InvoiceList facilityId={facilityId} />;
}

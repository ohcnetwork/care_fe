import { createFileRoute } from "@tanstack/react-router";

import InvoiceList from "@/pages/Facility/billing/invoice/InvoiceList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/invoices/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <InvoiceList facilityId={facilityId} />;
}

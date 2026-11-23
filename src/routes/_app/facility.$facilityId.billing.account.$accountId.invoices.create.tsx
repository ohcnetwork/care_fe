import { createFileRoute, useParams } from "@tanstack/react-router";

import CreateInvoicePage from "@/pages/Facility/billing/account/CreateInvoice";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/$accountId/invoices/create",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, accountId } = useParams({
    from: "/_app/facility/$facilityId/billing/account/$accountId/invoices/create",
  });
  return <CreateInvoicePage facilityId={facilityId} accountId={accountId} />;
}

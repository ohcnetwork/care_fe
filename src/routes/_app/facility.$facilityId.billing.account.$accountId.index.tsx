import { createFileRoute } from "@tanstack/react-router";

import AccountShow from "@/pages/Facility/billing/account/AccountShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/$accountId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, accountId } = Route.useParams();
  return (
    <AccountShow facilityId={facilityId} accountId={accountId} tab="invoices" />
  );
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import AccountShow from "@/pages/Facility/billing/account/AccountShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/$accountId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, accountId } = useParams({
    from: "/_app/facility/$facilityId/billing/account/$accountId/",
  });
  return (
    <AccountShow facilityId={facilityId} accountId={accountId} tab="invoices" />
  );
}

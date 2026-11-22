import { createFileRoute, useParams } from "@tanstack/react-router";

import { accountShowSearch } from "@/lib/router/search/billing";
import AccountShow from "@/pages/Facility/billing/account/AccountShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/$accountId/",
)({
  validateSearch: accountShowSearch,
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

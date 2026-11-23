import { createFileRoute, useParams } from "@tanstack/react-router";

import { accountShowSearch } from "@/lib/router/search/billing";
import AccountShow from "@/pages/Facility/billing/account/AccountShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/$accountId/$tab/",
)({
  validateSearch: accountShowSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, accountId, tab } = useParams({
    from: "/_app/facility/$facilityId/billing/account/$accountId/$tab/",
  });
  return (
    <AccountShow facilityId={facilityId} accountId={accountId} tab={tab} />
  );
}

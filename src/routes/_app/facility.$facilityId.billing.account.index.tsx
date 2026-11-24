import { createFileRoute, useParams } from "@tanstack/react-router";

import { accountListSearch } from "@/lib/router/search/billing";
import AccountList from "@/pages/Facility/billing/account/AccountList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/",
)({
  validateSearch: accountListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/billing/account/",
  });
  return <AccountList facilityId={facilityId} />;
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import { accountShowSearch } from "@/lib/router/search/billing";
import AccountShow from "@/pages/Facility/billing/account/AccountShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/$accountId/$tab/payment/$paymentType",
)({
  validateSearch: accountShowSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, accountId, tab, paymentType } = useParams({
    from: "/_app/facility/$facilityId/billing/account/$accountId/$tab/payment/$paymentType",
  });
  return (
    <AccountShow
      facilityId={facilityId}
      accountId={accountId}
      tab={tab}
      paymentType={paymentType}
    />
  );
}

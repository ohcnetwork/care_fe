import { createFileRoute } from "@tanstack/react-router";

import AccountShow from "@/pages/Facility/billing/account/AccountShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/$accountId/$tab/payment/$paymentType",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, accountId, tab, paymentType } = Route.useParams();
  return (
    <AccountShow
      facilityId={facilityId}
      accountId={accountId}
      tab={tab}
      paymentType={paymentType}
    />
  );
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import { accountQuery, startQuery } from "@/lib/router/pageQueries";
import AccountShow from "@/pages/Facility/billing/account/AccountShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/$accountId/$tab/",
)({
  loader: ({ context, params }) =>
    startQuery(context, accountQuery(params.facilityId, params.accountId)),
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

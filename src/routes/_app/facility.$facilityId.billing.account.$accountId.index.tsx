import { createFileRoute, useParams } from "@tanstack/react-router";

import { accountQuery, startQuery } from "@/lib/router/pageQueries";
import AccountShow from "@/pages/Facility/billing/account/AccountShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/$accountId/",
)({
  loader: ({ context, params }) =>
    startQuery(context, accountQuery(params.facilityId, params.accountId)),
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

import { createFileRoute } from "@tanstack/react-router";

import AccountList from "@/pages/Facility/billing/account/AccountList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/billing/account/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <AccountList facilityId={facilityId} />;
}

import { createFileRoute } from "@tanstack/react-router";

import { BillingSettingsLayout } from "@/pages/Facility/settings/billing/layout";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/billing",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <BillingSettingsLayout facilityId={facilityId} />;
}

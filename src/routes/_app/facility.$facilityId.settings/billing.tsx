import { createFileRoute, useParams } from "@tanstack/react-router";

import { BillingSettingsLayout } from "@/pages/Facility/settings/billing/layout";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/billing",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/billing",
  });
  return <BillingSettingsLayout facilityId={facilityId} />;
}

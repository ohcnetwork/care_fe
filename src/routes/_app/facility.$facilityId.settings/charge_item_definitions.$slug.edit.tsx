import { createFileRoute, useParams } from "@tanstack/react-router";

import { UpdateChargeItemDefinition } from "@/pages/Facility/settings/chargeItemDefinitions/UpdateChargeItemDefinition";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/charge_item_definitions/$slug/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, slug } = useParams({
    from: "/_app/facility/$facilityId/settings/charge_item_definitions/$slug/edit",
  });
  return <UpdateChargeItemDefinition facilityId={facilityId} slug={slug} />;
}

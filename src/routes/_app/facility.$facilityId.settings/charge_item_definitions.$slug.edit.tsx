import { createFileRoute } from "@tanstack/react-router";

import { UpdateChargeItemDefinition } from "@/pages/Facility/settings/chargeItemDefinitions/UpdateChargeItemDefinition";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/charge_item_definitions/$slug/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, slug } = Route.useParams();
  return <UpdateChargeItemDefinition facilityId={facilityId} slug={slug} />;
}

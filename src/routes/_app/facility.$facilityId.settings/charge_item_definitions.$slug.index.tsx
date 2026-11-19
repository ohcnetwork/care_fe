import { createFileRoute } from "@tanstack/react-router";

import { ChargeItemDefinitionDetail } from "@/pages/Facility/settings/chargeItemDefinitions/ChargeItemDefinitionDetail";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/charge_item_definitions/$slug/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, slug } = Route.useParams();
  return <ChargeItemDefinitionDetail facilityId={facilityId} slug={slug} />;
}

import { createFileRoute } from "@tanstack/react-router";

import { ChargeItemDefinitionsList } from "@/pages/Facility/settings/chargeItemDefinitions/ChargeItemDefinitionsList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/charge_item_definitions/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <ChargeItemDefinitionsList facilityId={facilityId} />;
}

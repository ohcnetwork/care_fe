import { createFileRoute, useParams } from "@tanstack/react-router";

import { chargeItemDefinitionsPageSearch } from "@/lib/router/search/settings";
import { ChargeItemDefinitionsList } from "@/pages/Facility/settings/chargeItemDefinitions/ChargeItemDefinitionsList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/charge_item_definitions/",
)({
  validateSearch: chargeItemDefinitionsPageSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/charge_item_definitions/",
  });
  return <ChargeItemDefinitionsList facilityId={facilityId} />;
}

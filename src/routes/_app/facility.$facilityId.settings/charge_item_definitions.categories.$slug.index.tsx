import { createFileRoute, useParams } from "@tanstack/react-router";

import { chargeItemDefinitionsPageSearch } from "@/lib/router/search/settings";
import { ChargeItemDefinitionsList } from "@/pages/Facility/settings/chargeItemDefinitions/ChargeItemDefinitionsList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/charge_item_definitions/categories/$slug/",
)({
  validateSearch: chargeItemDefinitionsPageSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, slug } = useParams({
    from: "/_app/facility/$facilityId/settings/charge_item_definitions/categories/$slug/",
  });
  return (
    <ChargeItemDefinitionsList facilityId={facilityId} categorySlug={slug} />
  );
}

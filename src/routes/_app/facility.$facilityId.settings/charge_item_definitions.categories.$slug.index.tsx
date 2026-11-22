import { createFileRoute, useParams } from "@tanstack/react-router";

import { ChargeItemDefinitionsList } from "@/pages/Facility/settings/chargeItemDefinitions/ChargeItemDefinitionsList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/charge_item_definitions/categories/$slug/",
)({
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

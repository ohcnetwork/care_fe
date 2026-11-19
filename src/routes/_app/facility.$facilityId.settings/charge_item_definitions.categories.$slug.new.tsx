import { createFileRoute } from "@tanstack/react-router";

import { CreateChargeItemDefinition } from "@/pages/Facility/settings/chargeItemDefinitions/CreateChargeItemDefinition";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/charge_item_definitions/categories/$slug/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, slug } = Route.useParams();
  return (
    <CreateChargeItemDefinition facilityId={facilityId} categorySlug={slug} />
  );
}

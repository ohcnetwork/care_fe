import { createFileRoute, useParams } from "@tanstack/react-router";

import { InventoryList } from "@/pages/Facility/services/inventory/InventoryList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/summary",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/summary",
  });
  return <InventoryList facilityId={facilityId} locationId={locationId} />;
}

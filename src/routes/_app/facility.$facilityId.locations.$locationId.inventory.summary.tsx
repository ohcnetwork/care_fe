import { createFileRoute, useParams } from "@tanstack/react-router";

import { inventoryListSearch } from "@/lib/router/search/inventory";
import { InventoryList } from "@/pages/Facility/services/inventory/InventoryList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/summary",
)({
  validateSearch: inventoryListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/summary",
  });
  return <InventoryList facilityId={facilityId} locationId={locationId} />;
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import { deliveryOrderPageSearch } from "@/lib/router/search/inventory";
import { DeliveryOrderShow } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/internal/$type/deliveries/$id/",
)({
  validateSearch: deliveryOrderPageSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, id } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/internal/$type/deliveries/$id/",
  });
  return (
    <DeliveryOrderShow
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={id}
      internal={true}
    />
  );
}

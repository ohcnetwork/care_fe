import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintDeliveryOrder } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/internal/$type/deliveries/$id/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, id } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/internal/$type/deliveries/$id/print",
  });
  return (
    <PrintDeliveryOrder
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={id}
      internal={true}
    />
  );
}

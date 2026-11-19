import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintDeliveryOrder } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/external/deliveries/$tab/$id/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, id } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/external/deliveries/$tab/$id/print",
  });
  return (
    <PrintDeliveryOrder
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={id}
      internal={false}
    />
  );
}

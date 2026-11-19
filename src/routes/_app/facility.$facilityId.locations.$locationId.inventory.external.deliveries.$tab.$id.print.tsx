import { createFileRoute } from "@tanstack/react-router";

import { PrintDeliveryOrder } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/PrintDeliveryOrder";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/external/deliveries/$tab/$id/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, id } = Route.useParams();
  return (
    <PrintDeliveryOrder
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={id}
      internal={false}
    />
  );
}

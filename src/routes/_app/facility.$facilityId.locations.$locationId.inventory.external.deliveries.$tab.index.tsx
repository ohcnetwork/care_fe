import { createFileRoute, useParams } from "@tanstack/react-router";

import { DeliveryOrderList } from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/external/deliveries/$tab/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, tab } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/external/deliveries/$tab/",
  });
  return (
    <DeliveryOrderList
      facilityId={facilityId}
      locationId={locationId}
      internal={false}
      isRequester={tab === "incoming"}
    />
  );
}

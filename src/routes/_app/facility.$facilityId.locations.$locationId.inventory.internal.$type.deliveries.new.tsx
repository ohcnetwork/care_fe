import { createFileRoute, useParams } from "@tanstack/react-router";

import DeliveryOrderForm from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/internal/$type/deliveries/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/internal/$type/deliveries/new",
  });
  return (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
    />
  );
}

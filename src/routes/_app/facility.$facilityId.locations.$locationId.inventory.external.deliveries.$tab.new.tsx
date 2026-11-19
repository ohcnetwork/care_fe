import { createFileRoute } from "@tanstack/react-router";

import DeliveryOrderForm from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/external/deliveries/$tab/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = Route.useParams();
  return (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={false}
    />
  );
}

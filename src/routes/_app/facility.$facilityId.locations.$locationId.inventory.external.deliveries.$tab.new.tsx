import { createFileRoute, useParams } from "@tanstack/react-router";

import { deliveryOrderPageSearch } from "@/lib/router/search/inventory";
import DeliveryOrderForm from "@/pages/Facility/services/inventory/externalSupply/deliveryOrder/DeliveryOrderForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/external/deliveries/$tab/new",
)({
  validateSearch: deliveryOrderPageSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/external/deliveries/$tab/new",
  });
  return (
    <DeliveryOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={false}
    />
  );
}

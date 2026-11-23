import { createFileRoute, useParams } from "@tanstack/react-router";

import RequestOrderForm from "@/pages/Facility/services/inventory/externalSupply/requestOrder/RequestOrderForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/internal/$type/orders/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/internal/$type/orders/new",
  });
  return (
    <RequestOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
    />
  );
}

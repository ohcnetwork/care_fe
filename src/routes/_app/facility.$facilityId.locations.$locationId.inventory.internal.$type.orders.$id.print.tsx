import { createFileRoute } from "@tanstack/react-router";

import { PrintRequestOrder } from "@/pages/Facility/services/inventory/externalSupply/requestOrder/PrintRequestOrder";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/internal/$type/orders/$id/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, id } = Route.useParams();
  return (
    <PrintRequestOrder
      facilityId={facilityId}
      locationId={locationId}
      requestOrderId={id}
      internal={true}
    />
  );
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import { RequestOrderShow } from "@/pages/Facility/services/inventory/externalSupply/requestOrder/RequestOrderShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/internal/$type/orders/$id/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, id } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/internal/$type/orders/$id/",
  });
  return (
    <RequestOrderShow
      facilityId={facilityId}
      locationId={locationId}
      requestOrderId={id}
      internal={true}
    />
  );
}

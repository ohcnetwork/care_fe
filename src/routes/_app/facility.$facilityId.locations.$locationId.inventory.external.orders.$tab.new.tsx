import { createFileRoute, useParams } from "@tanstack/react-router";

import RequestOrderForm from "@/pages/Facility/services/inventory/externalSupply/requestOrder/RequestOrderForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/external/orders/$tab/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/external/orders/$tab/new",
  });
  return (
    <RequestOrderForm
      facilityId={facilityId}
      locationId={locationId}
      internal={false}
    />
  );
}

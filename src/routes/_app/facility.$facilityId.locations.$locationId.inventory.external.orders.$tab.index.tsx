import { createFileRoute } from "@tanstack/react-router";

import { ExternalPurchasesList } from "@/pages/Facility/services/inventory/externalSupply/requestOrder/ExternalPurchasesList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/external/orders/$tab/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, tab } = Route.useParams();
  return (
    <ExternalPurchasesList
      facilityId={facilityId}
      locationId={locationId}
      isRequester={tab === "outgoing"}
    />
  );
}

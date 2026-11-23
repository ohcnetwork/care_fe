import { createFileRoute, useParams } from "@tanstack/react-router";

import { externalSupplyListSearch } from "@/lib/router/search/inventory";
import { ExternalPurchasesList } from "@/pages/Facility/services/inventory/externalSupply/requestOrder/ExternalPurchasesList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/external/orders/$tab/",
)({
  validateSearch: externalSupplyListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, tab } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/external/orders/$tab/",
  });
  return (
    <ExternalPurchasesList
      facilityId={facilityId}
      locationId={locationId}
      isRequester={tab === "outgoing"}
    />
  );
}

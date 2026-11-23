import { createFileRoute, useParams } from "@tanstack/react-router";

import { transferPageSearch } from "@/lib/router/search/inventory";
import { ToDispatch } from "@/pages/Facility/services/inventory/ToDispatch";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/internal/dispatch/$tab",
)({
  validateSearch: transferPageSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, tab } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/internal/dispatch/$tab",
  });
  return (
    <ToDispatch
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      tab={tab}
    />
  );
}

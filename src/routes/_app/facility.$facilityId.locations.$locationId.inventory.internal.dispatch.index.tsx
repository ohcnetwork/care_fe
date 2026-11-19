import { createFileRoute, useParams } from "@tanstack/react-router";

import { ToDispatch } from "@/pages/Facility/services/inventory/ToDispatch";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/internal/dispatch/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/internal/dispatch/",
  });
  return (
    <ToDispatch
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      tab={"orders"}
    />
  );
}

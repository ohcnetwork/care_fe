import { createFileRoute, useParams } from "@tanstack/react-router";

import { ToReceive } from "@/pages/Facility/services/inventory/ToReceive";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/inventory/internal/receive/$tab",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, tab } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/inventory/internal/receive/$tab",
  });
  return (
    <ToReceive
      facilityId={facilityId}
      locationId={locationId}
      internal={true}
      tab={tab}
    />
  );
}

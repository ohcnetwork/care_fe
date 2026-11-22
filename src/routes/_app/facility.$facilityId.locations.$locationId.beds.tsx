import { createFileRoute, useParams } from "@tanstack/react-router";

import { navigate } from "@/lib/router/navigate";
import { BedBoard } from "@/pages/Facility/locations/bed-board/BedBoard";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/beds",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/beds",
  });
  return (
    <div className="py-4">
      <BedBoard
        key={locationId}
        facilityId={facilityId}
        locationId={locationId}
        hideBreadcrumb
        onOpenLocation={(location) =>
          navigate({
            to: "/facility/$facilityId/locations/$locationId/beds",
            params: { facilityId, locationId: location.id },
          })
        }
      />
    </div>
  );
}

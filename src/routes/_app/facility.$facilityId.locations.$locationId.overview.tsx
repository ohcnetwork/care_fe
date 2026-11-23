import { createFileRoute, useParams } from "@tanstack/react-router";

import { LocationOverview } from "@/pages/Facility/locations/LocationOverview";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/overview",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/overview",
  });
  return <LocationOverview facilityId={facilityId} locationId={locationId} />;
}

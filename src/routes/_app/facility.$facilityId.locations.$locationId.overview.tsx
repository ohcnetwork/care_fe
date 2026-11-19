import { createFileRoute } from "@tanstack/react-router";

import { LocationOverview } from "@/pages/Facility/locations/LocationOverview";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/overview",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = Route.useParams();
  return <LocationOverview facilityId={facilityId} locationId={locationId} />;
}

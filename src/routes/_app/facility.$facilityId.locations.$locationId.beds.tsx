import { createFileRoute } from "@tanstack/react-router";

import BedsList from "@/pages/Facility/locations/BedsList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/beds",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = Route.useParams();
  return <BedsList facilityId={facilityId} locationId={locationId} />;
}

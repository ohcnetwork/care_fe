import { createFileRoute } from "@tanstack/react-router";

import LocationResponses from "@/pages/Facility/locations/LocationResponses";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/responses",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = Route.useParams();
  return (
    <LocationResponses
      key={locationId}
      facilityId={facilityId}
      locationId={locationId}
    />
  );
}

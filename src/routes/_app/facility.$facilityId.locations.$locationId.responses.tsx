import { createFileRoute, useParams } from "@tanstack/react-router";

import LocationResponses from "@/pages/Facility/locations/LocationResponses";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/responses",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/responses",
  });
  return (
    <LocationResponses
      key={locationId}
      facilityId={facilityId}
      locationId={locationId}
    />
  );
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import LocationSettings from "@/pages/Facility/settings/locations/LocationSettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/locations/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/locations/",
  });
  return <LocationSettings facilityId={facilityId} />;
}

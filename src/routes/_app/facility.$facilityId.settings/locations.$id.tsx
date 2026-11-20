import { createFileRoute, useParams } from "@tanstack/react-router";

import LocationSettings from "@/pages/Facility/settings/locations/LocationSettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/locations/$id",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/locations/$id",
  });
  return <LocationSettings facilityId={facilityId} locationId={id} />;
}

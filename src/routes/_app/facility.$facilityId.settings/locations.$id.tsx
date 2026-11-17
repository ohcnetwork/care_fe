import { createFileRoute } from "@tanstack/react-router";

import LocationSettings from "@/pages/Facility/settings/locations/LocationSettings";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/locations/$id",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return <LocationSettings facilityId={facilityId} locationId={id} />;
}

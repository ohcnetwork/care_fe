import { createFileRoute, useParams } from "@tanstack/react-router";

import LocationImport from "@/pages/Facility/settings/locations/LocationImport";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/locations/import",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/locations/import",
  });
  return <LocationImport facilityId={facilityId} />;
}

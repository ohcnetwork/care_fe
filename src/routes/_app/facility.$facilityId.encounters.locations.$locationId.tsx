import { createFileRoute } from "@tanstack/react-router";

import EncountersOverview from "@/pages/Encounters/EncountersOverview";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/encounters/locations/$locationId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = Route.useParams();
  return (
    <EncountersOverview
      facilityId={facilityId}
      tab="locations"
      locationId={locationId}
    />
  );
}

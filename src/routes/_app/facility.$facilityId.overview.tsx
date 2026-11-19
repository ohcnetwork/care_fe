import { createFileRoute } from "@tanstack/react-router";

import { FacilityOverview } from "@/pages/Facility/overview";

export const Route = createFileRoute("/_app/facility/$facilityId/overview")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <FacilityOverview facilityId={facilityId} />;
}

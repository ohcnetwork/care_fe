import { createFileRoute } from "@tanstack/react-router";

import FacilityUsers from "@/components/Facility/FacilityUsers";

export const Route = createFileRoute("/_app/facility/$facilityId/users/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <FacilityUsers facilityId={facilityId} />;
}

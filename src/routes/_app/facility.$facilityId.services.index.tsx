import { createFileRoute } from "@tanstack/react-router";

import FacilityServices from "@/pages/Facility/services/FacilityServices";

export const Route = createFileRoute("/_app/facility/$facilityId/services/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <FacilityServices facilityId={facilityId} />;
}

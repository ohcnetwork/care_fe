import { createFileRoute, useParams } from "@tanstack/react-router";

import FacilityServices from "@/pages/Facility/services/FacilityServices";

export const Route = createFileRoute("/_app/facility/$facilityId/services/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/services/",
  });
  return <FacilityServices facilityId={facilityId} />;
}

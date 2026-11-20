import { createFileRoute, useParams } from "@tanstack/react-router";

import FacilityUsers from "@/components/Facility/FacilityUsers";

export const Route = createFileRoute("/_app/facility/$facilityId/users/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/users/",
  });
  return <FacilityUsers facilityId={facilityId} />;
}

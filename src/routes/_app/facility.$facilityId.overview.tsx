import { createFileRoute, useParams } from "@tanstack/react-router";

import { FacilityOverview } from "@/pages/Facility/overview";

export const Route = createFileRoute("/_app/facility/$facilityId/overview")({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/overview",
  });
  return <FacilityOverview facilityId={facilityId} />;
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import BedAvailabilityDashboard from "@/pages/Facility/BedAvailabilityDashboard";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/bed-availability",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/bed-availability",
  });
  return <BedAvailabilityDashboard facilityId={facilityId} />;
}

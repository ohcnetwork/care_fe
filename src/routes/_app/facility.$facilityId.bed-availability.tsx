import { createFileRoute, useParams } from "@tanstack/react-router";

import { bedAvailabilitySearch } from "@/lib/router/search/services";
import BedAvailabilityDashboard from "@/pages/Facility/BedAvailabilityDashboard";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/bed-availability",
)({
  validateSearch: bedAvailabilitySearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/bed-availability",
  });
  return <BedAvailabilityDashboard facilityId={facilityId} />;
}

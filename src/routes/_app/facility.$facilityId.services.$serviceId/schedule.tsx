import { createFileRoute, useParams } from "@tanstack/react-router";

import { ScheduleHome } from "@/components/Schedule/ScheduleHome";
import { scheduleHomeSearch } from "@/lib/router/search/scheduling";

import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/schedule",
)({
  validateSearch: scheduleHomeSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, serviceId } = useParams({
    from: "/_app/facility/$facilityId/services/$serviceId/schedule",
  });
  return (
    <ScheduleHome
      facilityId={facilityId}
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
    />
  );
}

import { createFileRoute } from "@tanstack/react-router";

import { ScheduleHome } from "@/components/Schedule/ScheduleHome";

import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/schedule",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, serviceId } = Route.useParams();
  return (
    <ScheduleHome
      facilityId={facilityId}
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
    />
  );
}

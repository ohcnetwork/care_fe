import { createFileRoute } from "@tanstack/react-router";

import QueuesIndex from "@/pages/Facility/queues/QueuesIndex";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/queues/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, serviceId } = Route.useParams();
  return (
    <QueuesIndex
      facilityId={facilityId}
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
    />
  );
}

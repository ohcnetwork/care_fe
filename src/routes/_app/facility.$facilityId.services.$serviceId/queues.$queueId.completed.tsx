import { createFileRoute } from "@tanstack/react-router";

import { ManageQueuePage } from "@/pages/Facility/queues/ManageQueue";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/queues/$queueId/completed",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, serviceId, queueId } = Route.useParams();
  return (
    <ManageQueuePage
      facilityId={facilityId}
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
      queueId={queueId}
      tab="completed"
    />
  );
}

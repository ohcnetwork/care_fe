import { createFileRoute } from "@tanstack/react-router";

import { ManageQueuePage } from "@/pages/Facility/queues/ManageQueue";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/queues/$queueId/completed",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, queueId } = Route.useParams();
  return (
    <ManageQueuePage
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Location}
      resourceId={locationId}
      queueId={queueId}
      tab="completed"
    />
  );
}

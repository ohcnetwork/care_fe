import { createFileRoute } from "@tanstack/react-router";

import { ManageQueuePage } from "@/pages/Facility/queues/ManageQueue";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/practitioner/$practitionerId/queues/$queueId/ongoing",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, practitionerId, queueId } = Route.useParams();
  return (
    <ManageQueuePage
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Practitioner}
      resourceId={practitionerId}
      queueId={queueId}
      tab="ongoing"
    />
  );
}

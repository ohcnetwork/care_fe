import { createFileRoute, useParams } from "@tanstack/react-router";

import { queueBoardSearch } from "@/lib/router/search/queues";
import { ManageQueuePage } from "@/pages/Facility/queues/ManageQueue";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/queues/$queueId/ongoing",
)({
  validateSearch: queueBoardSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, queueId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/queues/$queueId/ongoing",
  });
  return (
    <ManageQueuePage
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Location}
      resourceId={locationId}
      queueId={queueId}
      tab="ongoing"
    />
  );
}

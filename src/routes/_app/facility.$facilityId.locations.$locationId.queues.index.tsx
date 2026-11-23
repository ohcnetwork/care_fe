import { createFileRoute, useParams } from "@tanstack/react-router";

import { queueListSearch } from "@/lib/router/search/queues";
import QueuesIndex from "@/pages/Facility/queues/QueuesIndex";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/queues/",
)({
  validateSearch: queueListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/queues/",
  });
  return (
    <QueuesIndex
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Location}
      resourceId={locationId}
    />
  );
}

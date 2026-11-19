import { createFileRoute } from "@tanstack/react-router";

import TokenEncounterRedirect from "@/pages/Facility/queues/TokenEncounterRedirect";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/queue/$queueId/token/$tokenId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, queueId, tokenId } = Route.useParams();
  return (
    <TokenEncounterRedirect
      facilityId={facilityId}
      tokenId={tokenId}
      queueId={queueId}
    />
  );
}

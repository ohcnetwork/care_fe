import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/queues/$queueId/",
)({
  beforeLoad: ({ params }) => {
    // Keep the query and the hash, as the legacy `Redirect` did.
    throw redirect({
      to: "/facility/$facilityId/locations/$locationId/queues/$queueId/ongoing",
      params,
      search: true,
      hash: true,
      replace: true,
    });
  },
});

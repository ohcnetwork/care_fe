import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/practitioner/$practitionerId/queues/$queueId/",
)({
  beforeLoad: ({ params, location }) => {
    // Same as the raviger `Redirect`: replace the entry and keep query and hash.
    throw redirect({
      to: "/facility/$facilityId/practitioner/$practitionerId/queues/$queueId/ongoing",
      params,
      search: location.search,
      hash: location.hash || undefined,
      replace: true,
    });
  },
});

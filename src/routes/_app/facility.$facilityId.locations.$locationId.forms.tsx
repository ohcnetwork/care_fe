import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/forms",
)({
  beforeLoad: ({ params }) => {
    // Keep the query and the hash, as the legacy `Redirect` did.
    throw redirect({
      to: "/facility/$facilityId/locations/$locationId/responses",
      params,
      search: true,
      hash: true,
      replace: true,
    });
  },
});

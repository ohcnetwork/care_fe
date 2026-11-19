import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/billing/",
)({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/facility/$facilityId/settings/billing/discount_codes",
      params,
      search: true,
      hash: true,
      replace: true,
    });
  },
});

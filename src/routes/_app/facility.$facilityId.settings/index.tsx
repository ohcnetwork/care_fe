import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/facility/$facilityId/settings/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/facility/$facilityId/settings/general",
      params,
      replace: true,
    });
  },
});

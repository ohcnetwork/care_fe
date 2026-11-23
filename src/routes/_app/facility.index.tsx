import { createFileRoute } from "@tanstack/react-router";

import { redirectKeepingQuery } from "@/lib/router/auth";

/** `/facility` has no page. Staff users go to the dashboard. */
export const Route = createFileRoute("/_app/facility/")({
  beforeLoad: ({ location }) => {
    throw redirectKeepingQuery("/", location);
  },
});

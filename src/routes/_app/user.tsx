import { createFileRoute } from "@tanstack/react-router";

import { redirectKeepingQuery } from "@/lib/router/auth";

export const Route = createFileRoute("/_app/user")({
  beforeLoad: ({ location }) => {
    throw redirectKeepingQuery("/users", location);
  },
});

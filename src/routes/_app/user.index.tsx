import { createFileRoute } from "@tanstack/react-router";

import { redirectKeepingQuery } from "@/lib/router/auth";

// This file replaces `user.tsx`. A parent `user.tsx` would run this redirect
// for `/user/$tab` too.
export const Route = createFileRoute("/_app/user/")({
  beforeLoad: ({ location }) => {
    throw redirectKeepingQuery("/users", location);
  },
});

import { createFileRoute } from "@tanstack/react-router";

import SessionExpired from "@/components/ErrorPages/SessionExpired";

import { staffOrPublic } from "@/lib/router/auth";

/** Shared URL: same page, in the staff or the public chrome. */
export const Route = createFileRoute("/session-expired")({
  beforeLoad: staffOrPublic,
  staticData: { sidebar: false },
  component: SessionExpired,
});

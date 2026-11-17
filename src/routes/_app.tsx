import { createFileRoute } from "@tanstack/react-router";

import { requireStaff } from "@/lib/router/auth";

/**
 * Staff area. Signed-out users and patients go to the staff sign-in. The
 * root route renders the staff shell around these pages.
 */
export const Route = createFileRoute("/_app")({
  beforeLoad: requireStaff,
});

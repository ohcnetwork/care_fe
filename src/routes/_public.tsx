import { createFileRoute } from "@tanstack/react-router";

import { publicOnly } from "@/lib/router/auth";

/** Public area: sign-in and pages for patients. Staff users go to `/`. */
export const Route = createFileRoute("/_public")({
  beforeLoad: publicOnly,
});

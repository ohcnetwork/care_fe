import { createFileRoute } from "@tanstack/react-router";

import AppRouter from "@/Routers/AppRouter";

/**
 * Pages that are not migrated yet. This layout renders the raviger route
 * tables once for all its children, so a legacy page does not remount when
 * the user moves to another legacy page. The children have no component:
 * they exist to carry layout flags (`staticData`) for their URLs, and
 * Phase 4 gives them their real pages.
 */
export const Route = createFileRoute("/_app/_legacy")({
  component: AppRouter,
});

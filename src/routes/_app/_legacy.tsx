import { createFileRoute } from "@tanstack/react-router";

import AppRouter from "@/Routers/AppRouter";

/**
 * The legacy catch-all for staff paths that have no file route: plugin
 * routes from manifests and plugin organization tabs, rendered with
 * raviger, and not-found. Every core page is a file route. Phase 6
 * removes this layout with raviger.
 */
export const Route = createFileRoute("/_app/_legacy")({
  component: AppRouter,
});

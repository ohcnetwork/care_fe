import { createFileRoute } from "@tanstack/react-router";

import AppRouter from "@/Routers/AppRouter";

/**
 * Legacy splat. Every signed-in path that has no route in `src/routes/`
 * renders the raviger route tables. Remove this route when the last area
 * is migrated.
 */
export const Route = createFileRoute("/_app/$")({
  component: AppRouter,
});

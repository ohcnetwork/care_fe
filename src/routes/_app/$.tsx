import { createFileRoute } from "@tanstack/react-router";

import { PluginPathNotFound } from "@/components/Common/PluginPathNotFound";

/**
 * Catch-all for staff paths that have no route. Plugin routes attach to the
 * tree when their manifests load (`src/lib/router/pluginRoutes.tsx`). Until
 * then, this shows a spinner; after that, not-found.
 */
export const Route = createFileRoute("/_app/$")({
  component: PluginPathNotFound,
});

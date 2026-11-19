import { createFileRoute } from "@tanstack/react-router";

/**
 * Legacy splat: every signed-in path that has no route in `src/routes/`.
 * The `_legacy` layout renders its page. Remove it when the last area is
 * migrated.
 */
export const Route = createFileRoute("/_app/_legacy/$")({});

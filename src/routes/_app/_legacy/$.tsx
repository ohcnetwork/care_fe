import { createFileRoute } from "@tanstack/react-router";

/**
 * Catch-all for staff paths that have no file route. The `_legacy` layout
 * renders it.
 */
export const Route = createFileRoute("/_app/_legacy/$")({});

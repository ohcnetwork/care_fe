import type { AnyRouter, RouterState } from "@tanstack/react-router";

/** The layout that renders every page that is not migrated yet. */
const LEGACY_LAYOUT_ROUTE_ID = "/_app/_legacy";

/**
 * The route that renders the page. Routes under the legacy layout have no
 * component: the legacy layout renders their pages.
 */
function pageRouteId(routeId: string | undefined) {
  return routeId?.startsWith(`${LEGACY_LAYOUT_ROUTE_ID}/`)
    ? LEGACY_LAYOUT_ROUTE_ID
    : routeId;
}

function trimTrailingSlash(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * True while the router moves to a path that needs a different route than
 * the committed page. The committed (previous) page stays on screen until
 * the new matches commit.
 *
 * A change that renders in the same route (a query change, or one legacy
 * page to another under the legacy layout) returns false: the raviger shim
 * shows the new page at once, as raviger did.
 */
export function isShowingPreviousPage(
  router: AnyRouter,
  state: RouterState<AnyRouter["routeTree"]>,
) {
  const deepest = state.matches[state.matches.length - 1];
  if (
    !deepest ||
    trimTrailingSlash(deepest.pathname) ===
      trimTrailingSlash(state.location.pathname)
  ) {
    return false;
  }
  const [, , route] = router.getMatchedRoutes(state.location.pathname);
  return pageRouteId(route?.id) !== pageRouteId(deepest.routeId);
}

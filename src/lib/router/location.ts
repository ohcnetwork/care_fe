import { type ParsedLocation, useRouterState } from "@tanstack/react-router";
import { useLayoutEffect, useRef } from "react";

import { isShowingPreviousPage } from "@/lib/router/previousPage";
import { getRouter } from "@/lib/router/routerRef";

/**
 * The location of the page that is on screen.
 *
 * `state.location` moves as soon as a navigation starts, before the new
 * matches render. `state.resolvedLocation` moves only after they painted.
 *
 * - The new location renders in the same route as the current page (for
 *   example a query change): the new location at once. Code that writes the
 *   query twice in a row then merges with the latest value.
 * - The new location needs a different route: the previous location until
 *   the new matches commit. The previous page stays on screen until then,
 *   and must not read the location of the next page.
 *
 * Prefer `useParams` and `useSearch` from `@tanstack/react-router` where the
 * route is known. Use this hook for code that reads the URL of any page,
 * such as the sidebar.
 */
export function useCurrentLocation(): ParsedLocation {
  const router = getRouter();
  return useRouterState({
    router,
    select: (state) =>
      isShowingPreviousPage(router, state)
        ? (state.resolvedLocation ?? state.location)
        : state.location,
  });
}

/** The path name (`/facility/123/overview`) of the page that is on screen. */
export function usePathname(): string {
  return useCurrentLocation().pathname || "/";
}

/**
 * Calls `callback` on each history change (push, replace, back, forward),
 * when the URL changes and before the new page renders. It does not call it
 * on mount.
 */
export function useLocationChange(callback: () => void) {
  const callbackRef = useRef(callback);
  useLayoutEffect(() => {
    callbackRef.current = callback;
  });

  useLayoutEffect(
    () => getRouter().history.subscribe(() => callbackRef.current()),
    [],
  );
}

import { type ParsedLocation, useRouter } from "@tanstack/react-router";
import { useLayoutEffect } from "react";

import { navigate } from "@/lib/router/navigate";
import { getRouter } from "@/lib/router/routerRef";

/**
 * In-app locations of this session by history index (`__TSR_index`, kept by
 * the router in `history.state`). Entries below the current index are the
 * real entries the browser goes back to.
 */
const trail: (string | undefined)[] = [];

function recordLocation(location: ParsedLocation) {
  trail[location.state.__TSR_index] = location.href;
}

/**
 * Records in-app locations while mounted. Mount it in the signed-in shell so
 * signing out ends the trail with the session.
 */
export function useNavigationTrail() {
  const router = useRouter();
  useLayoutEffect(() => {
    recordLocation(router.state.location);
    const unsubscribe = router.subscribe("onResolved", ({ toLocation }) =>
      recordLocation(toLocation),
    );
    return () => {
      unsubscribe();
      trail.length = 0;
    };
  }, [router]);
}

/**
 * Goes back to the latest history entry whose path `isOutside` accepts, as a
 * real browser back (`history.go(-n)`). Replaces the current entry with
 * `fallback` when this session has no such entry: the page was opened
 * directly, reloaded, or reached from another site.
 */
export function navigateBackFrom(
  isOutside: (pathname: string) => boolean,
  fallback: string,
) {
  const router = getRouter();
  const current = router.history.location.state.__TSR_index;
  for (let index = current - 1; index >= 0; index--) {
    const href = trail[index];
    // Unknown entries: before a reload or a sign-in.
    if (href === undefined) break;
    if (isOutside(href.split(/[?#]/)[0])) {
      router.history.go(index - current);
      return;
    }
  }
  navigate({ href: fallback, replace: true });
}

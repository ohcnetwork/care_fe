import { navigate, RavigerLocation, useLocationChange } from "raviger";
import { useLayoutEffect } from "react";

/** In-app locations visited in this session, oldest first. */
const trail: string[] = [];

function recordLocation({ fullPath, search, initiatedBy }: RavigerLocation) {
  const location = fullPath + search;
  if (initiatedBy === "replace") trail.pop();
  if (trail.at(-1) !== location) trail.push(location);
  if (trail.length > 100) trail.shift();
}

/**
 * Records in-app locations while mounted. Mount it in the signed-in router so
 * signing out (a client-side navigation) ends the trail with the session.
 */
export function useNavigationTrail() {
  useLayoutEffect(
    () => () => {
      trail.length = 0;
    },
    [],
  );
  useLocationChange(recordLocation, { onInitial: true });
}

/**
 * Returns to the latest visited location whose path `isOutside` accepts,
 * skipping everything visited after it. Falls back when there is none: the
 * page was opened directly, reloaded, or reached from another site.
 */
export function navigateBackFrom(
  isOutside: (pathname: string) => boolean,
  fallback: string,
) {
  for (let index = trail.length - 1; index >= 0; index--) {
    if (isOutside(trail[index].split("?")[0])) {
      const target = trail[index];
      // The navigation records the target again.
      trail.length = index;
      navigate(target);
      return;
    }
  }
  navigate(fallback);
}

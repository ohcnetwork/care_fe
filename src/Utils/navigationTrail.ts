import { navigate, RavigerLocation } from "raviger";

/** In-app locations visited since this page load, oldest first. */
const trail: string[] = [];

export function recordLocation({
  fullPath,
  search,
  initiatedBy,
}: RavigerLocation) {
  const location = fullPath + search;
  if (initiatedBy === "replace") trail.pop();
  if (trail.at(-1) !== location) trail.push(location);
  if (trail.length > 100) trail.shift();
}

/**
 * Returns to the latest visited location that `isOutside` accepts, skipping
 * everything visited after it. Falls back when there is none: the page was
 * opened directly, reloaded, or reached from another site.
 */
export function navigateBackFrom(
  isOutside: (location: string) => boolean,
  fallback: string,
) {
  for (let index = trail.length - 1; index >= 0; index--) {
    if (isOutside(trail[index])) {
      const target = trail[index];
      // The navigation records the target again.
      trail.length = index;
      navigate(target);
      return;
    }
  }
  navigate(fallback);
}

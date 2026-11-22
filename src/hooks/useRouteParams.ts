import { usePathname } from "@/lib/router/location";

/**
 * Extracts parameter names from a path pattern
 * Example: "/facility/:facilityId" -> "facilityId"
 */
type ExtractParamNames<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParamNames<Rest>
    : T extends `${string}:${infer Param}`
      ? Param
      : never;

type RouteParams<T extends string> = {
  [K in ExtractParamNames<T>]: string | undefined;
};

/**
 * Matches `pattern` (`/facility/:facilityId`) against the start of `path`,
 * case-insensitively, as raviger did. Returns the params, or `null`.
 */
function matchPathPrefix(pattern: string, path: string) {
  const names: string[] = [];
  const source = pattern
    .replace(/[-\\^$+?.()|[\]{}*]/g, "\\$&")
    .replace(/:([a-zA-Z_]+)/g, (_, name: string) => {
      names.push(name);
      return "([^/]+)";
    });
  const match = path
    .replace(/\/+$/, "")
    .match(new RegExp(`^${source}(?:/|$)`, "i"));
  if (!match) return null;
  return Object.fromEntries(
    names.map((name, index) => [name, match[index + 1]]),
  );
}

/**
 * Reads params from the current URL with a path pattern, for components that
 * render on any page (such as the sidebar). The pattern matches the path or
 * the start of it: `/facility/:facilityId` matches
 * `/facility/123/settings` too.
 *
 * In a route component, use `useParams` from `@tanstack/react-router`.
 *
 * @param path - The path pattern (e.g. "/facility/:facilityId")
 */
export function useRouteParams<T extends string>(path: T): RouteParams<T> {
  const pathname = usePathname();
  return (matchPathPrefix(path, pathname) ?? {}) as RouteParams<T>;
}

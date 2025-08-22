import { usePathParams } from "raviger";

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
 * Hook to extract route parameters from both exact and wildcard matches
 * @param path - The path pattern (e.g. "/facility/:facilityId")
 * @returns Object containing all route parameters
 */
export function useRouteParams<T extends string>(path: T): RouteParams<T> {
  const exactMatch = usePathParams(path);
  const subpathMatch = usePathParams(`${path}/*`);

  return { ...subpathMatch, ...exactMatch } as RouteParams<T>;
}

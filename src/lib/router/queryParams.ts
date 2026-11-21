import { useCallback } from "react";

import { useCurrentLocation } from "@/lib/router/location";
import { navigate } from "@/lib/router/navigate";
import { getRouter } from "@/lib/router/routerRef";

/** Query string values. Every value that is read is a string. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type QueryParams = Record<string, any>;

export interface SetQueryParamsOptions {
  /**
   * Replace the whole query string. `false` merges `query` into it and keeps
   * the hash.
   * @default true
   */
  overwrite?: boolean;
  /**
   * Replace the current history entry, not push a new one.
   * @default false
   */
  replace?: boolean;
}

function parseQuery<T extends QueryParams>(query: string): T {
  return Object.fromEntries(new URLSearchParams(query).entries()) as T;
}

function serializeQuery(query: QueryParams): string {
  return new URLSearchParams(
    Object.entries(query).filter(([, value]) => value !== null),
  ).toString();
}

/**
 * Reads and writes the query string of the current page.
 *
 * - Read: the query of the page that is on screen (see `useCurrentLocation`),
 *   as strings.
 * - Write: `setQueryParams(query, { overwrite, replace })`. A `null` value
 *   removes the key. A write merges with the latest URL, also before the
 *   page renders again.
 *
 * Prefer `useSearch` from `@tanstack/react-router` where the route is known.
 */
export function useQueryParams<T extends QueryParams = QueryParams>(): [
  T,
  (query: T, options?: SetQueryParamsOptions) => void,
] {
  const { searchStr } = useCurrentLocation();

  const setQueryParams = useCallback(
    (
      query: T,
      { overwrite = true, replace = false }: SetQueryParamsOptions = {},
    ) => {
      const location = getRouter().history.location;
      const next = overwrite
        ? query
        : { ...parseQuery<T>(location.search), ...query };
      const serialized = serializeQuery(next);
      let href = location.pathname;
      if (serialized) href += "?" + serialized;
      if (!overwrite) href += location.hash;
      navigate({ href, replace });
    },
    [],
  );

  return [parseQuery<T>(searchStr), setQueryParams];
}

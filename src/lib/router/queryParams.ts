import { useCallback } from "react";

import { useCurrentLocation } from "@/lib/router/location";
import { keepsScrollOnArrival, navigate } from "@/lib/router/navigate";
import { getRouter } from "@/lib/router/routerRef";
import {
  readSearch,
  type SearchSchema,
  type SearchValues,
} from "@/lib/router/search/fields";

/** Query string values, as a page or a scoped widget holds them. */
export type QueryParams = Record<string, unknown>;

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

function parseQuery(query: string): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(query).entries());
}

function serializeQuery(query: object): string {
  return new URLSearchParams(
    Object.entries(query)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  ).toString();
}

export type SetQueryParams = (
  /** The values to write. `null` and `undefined` remove a key. */
  query: object,
  options?: SetQueryParamsOptions,
) => void;

/**
 * Reads and writes the query string of the current page.
 *
 * - Read: the query of the page that is on screen (see `useCurrentLocation`).
 *   With a search schema (`src/lib/router/search/`), the values that the
 *   schema lists are parsed and typed. Without one, every value is a string:
 *   use that only to copy the whole query string.
 * - Write: `setQueryParams(query, { overwrite, replace })`. A `null` or
 *   `undefined` value removes the key (a schema reads an invalid value as
 *   `undefined`). A write merges with the latest URL, also before the page
 *   renders again.
 *
 * Prefer `useSearch` from `@tanstack/react-router` where the route is known.
 */
export function useQueryParams<S extends SearchSchema>(
  schema: S,
): [SearchValues<S>, SetQueryParams];
export function useQueryParams(): [Record<string, string>, SetQueryParams];
export function useQueryParams(
  schema?: SearchSchema,
): [Record<string, unknown>, SetQueryParams] {
  const { searchStr } = useCurrentLocation();

  const setQueryParams = useCallback<SetQueryParams>(
    (query, { overwrite = true, replace = false } = {}) => {
      const router = getRouter();
      const location = router.history.location;
      const next = overwrite
        ? query
        : { ...parseQuery(location.search), ...query };
      const serialized = serializeQuery(next);
      let href = location.pathname;
      if (serialized) href += "?" + serialized;
      if (!overwrite) href += location.hash;
      // Filters and selection update this page, so keep its scroll position.
      // A page that writes default filters while it mounts is not on screen
      // yet. Its scroll reset must not be cancelled, unless the navigation
      // that opened it keeps the scroll (tab links). A retained hash must not
      // scroll to its target again.
      // History keeps the path as typed (`%72`), the router decodes it.
      const { pathname } = router.parseLocation(location);
      const keepScroll =
        router.state.resolvedLocation?.pathname === pathname ||
        keepsScrollOnArrival(pathname);
      navigate({
        href,
        replace,
        resetScroll: keepScroll ? false : undefined,
        hashScrollIntoView: false,
      });
    },
    [],
  );

  const params = parseQuery(searchStr);
  return [schema ? readSearch(schema, params) : params, setQueryParams];
}

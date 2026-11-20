import { useCallback } from "react";

import { useCurrentLocation } from "@/lib/router/location";
import { navigate } from "@/lib/router/navigate";
import { getRouter } from "@/lib/router/routerRef";
import {
  readSearch,
  type SearchSchema,
  type SearchValues,
} from "@/lib/router/search/fields";

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
    Object.entries(query).filter(
      ([, value]) => value !== null && value !== undefined,
    ),
  ).toString();
}

export type SetQueryParams<T extends QueryParams = QueryParams> = (
  query: T,
  options?: SetQueryParamsOptions,
) => void;

/**
 * Reads and writes the query string of the current page.
 *
 * - Read: the query of the page that is on screen (see `useCurrentLocation`),
 *   as strings. With a search schema (`src/lib/router/search/`), the values
 *   that the schema lists are parsed and typed.
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
export function useQueryParams<T extends QueryParams = QueryParams>(
  schema?: undefined,
): [T, SetQueryParams<T>];
export function useQueryParams(
  schema?: SearchSchema,
): [QueryParams, SetQueryParams] {
  const { searchStr } = useCurrentLocation();

  const setQueryParams = useCallback<SetQueryParams>(
    (query, { overwrite = true, replace = false } = {}) => {
      const location = getRouter().history.location;
      const next = overwrite
        ? query
        : { ...parseQuery(location.search), ...query };
      const serialized = serializeQuery(next);
      let href = location.pathname;
      if (serialized) href += "?" + serialized;
      if (!overwrite) href += location.hash;
      navigate({ href, replace });
    },
    [],
  );

  const params = parseQuery(searchStr);
  return [schema ? readSearch(schema, params) : params, setQueryParams];
}

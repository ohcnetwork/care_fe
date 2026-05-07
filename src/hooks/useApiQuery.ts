import {
  UseQueryOptions,
  UseQueryResult,
  useQuery,
} from "@tanstack/react-query";

import { getQueryOverride } from "@/lib/override/api";
import { getRouteMeta } from "@/Utils/request/routeMeta";

/**
 * `useQuery` with plug overrides. Same signature as TanStack's hook;
 * if `queryFn` came from `query(route, …)` (or `query.debounced` /
 * `query.paginated`) and a plug has registered an override for that
 * route, the override's options run instead.
 */
export function useApiQuery<TData = unknown, TError = Error>(
  options: UseQueryOptions<TData, TError>,
): UseQueryResult<TData, TError> {
  const meta = getRouteMeta(options.queryFn);
  const override = meta ? getQueryOverride(meta.route) : undefined;

  const replacement =
    override && meta
      ? (override(
          options as unknown as Parameters<NonNullable<typeof override>>[0],
          {
            pathname:
              typeof window !== "undefined" ? window.location.pathname : "",
            pathParams: (meta.pathParams ?? {}) as Record<
              string,
              string | number | undefined
            >,
            queryParams: (meta.queryParams ?? {}) as Record<
              string,
              string | number | boolean | undefined
            >,
          },
        ) as UseQueryOptions<TData, TError> | null | undefined)
      : undefined;

  return useQuery(replacement ?? options);
}

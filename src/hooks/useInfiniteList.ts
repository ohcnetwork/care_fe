import {
  DefaultError,
  InfiniteData,
  QueryClient,
  QueryKey,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { IntersectionOptions, useInView } from "react-intersection-observer";

import { PaginatedResponse } from "@/Utils/request/types";

type ItemOf<TPage extends PaginatedResponse<unknown>> =
  TPage["results"][number];

/**
 * Merges the pages of an infinite query into one {@link PaginatedResponse}.
 * The `count` comes from the latest page.
 */
export function flattenPages<TPage extends PaginatedResponse<unknown>>(
  data: InfiniteData<TPage, number>,
): PaginatedResponse<ItemOf<TPage>> {
  return {
    count: data.pages.at(-1)?.count ?? 0,
    results: data.pages.flatMap((page) => page.results),
  };
}

export type UseInfiniteListOptions<
  TQueryFnData extends PaginatedResponse<unknown>,
  TError = DefaultError,
  TData = PaginatedResponse<ItemOf<TQueryFnData>>,
  TQueryKey extends QueryKey = QueryKey,
> = UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, number> & {
  /** Options passed to `useInView` for the sentinel element. */
  inViewOptions?: IntersectionOptions;
};

export type UseInfiniteListResult<
  TData,
  TError = DefaultError,
> = UseInfiniteQueryResult<TData, TError> & {
  /**
   * Attach to a sentinel element at the end of the list. The next page is
   * fetched when the element scrolls into view. Leave it unattached to load
   * the pages manually with `fetchNextPage`.
   */
  ref: (node?: Element | null) => void;
};

/**
 * `useInfiniteQuery` for limit-offset paginated lists, with infinite scroll.
 *
 * - `data` is the merged pages as `{ count, results }` by default. Pass your
 *   own `select` to change it; it gets the raw `InfiniteData`.
 * - Attach the returned `ref` to an element at the end of the list. The next
 *   page is fetched when it is in view, there is a next page, and no fetch is
 *   in flight. If fetching the next page fails, it is not fetched again
 *   automatically; call `fetchNextPage` to retry.
 *
 * Use with `query.infinite to get the `queryFn`, `initialPageParam`
 * and `getNextPageParam`:
 *
 * ```tsx
 * const { data, isLoading, ref } = useInfiniteList({
 *   queryKey: ["roles", search],
 *   ...query.infinite(roleApi.listRoles, { queryParams: { name: search } }),
 * });
 *
 * return (
 *   <>
 *     {data?.results.map((role) => <Role key={role.id} role={role} />)}
 *     <div ref={ref} />
 *   </>
 * );
 * ```
 */
// Without `select`, `data` is the merged pages.
export function useInfiniteList<
  TQueryFnData extends PaginatedResponse<unknown>,
  TError = DefaultError,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseInfiniteListOptions<
    TQueryFnData,
    TError,
    PaginatedResponse<ItemOf<TQueryFnData>>,
    TQueryKey
  > & { select?: undefined },
  queryClient?: QueryClient,
): UseInfiniteListResult<PaginatedResponse<ItemOf<TQueryFnData>>, TError>;

// With `select`, `data` is what `select` returns.
// Overloads are not redeclarations; TypeScript checks real ones (TS2451).
// eslint-disable-next-line no-redeclare
export function useInfiniteList<
  TQueryFnData extends PaginatedResponse<unknown>,
  TError = DefaultError,
  TData = unknown,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseInfiniteListOptions<TQueryFnData, TError, TData, TQueryKey> & {
    select: (data: InfiniteData<TQueryFnData, number>) => TData;
  },
  queryClient?: QueryClient,
): UseInfiniteListResult<TData, TError>;

// eslint-disable-next-line no-redeclare
export function useInfiniteList<
  TQueryFnData extends PaginatedResponse<unknown>,
  TError,
  TQueryKey extends QueryKey,
>(
  {
    inViewOptions,
    select = flattenPages,
    ...options
  }: UseInfiniteListOptions<TQueryFnData, TError, unknown, TQueryKey>,
  queryClient?: QueryClient,
): UseInfiniteListResult<unknown, TError> {
  const result = useInfiniteQuery({ ...options, select }, queryClient);

  const { ref, inView } = useInView(inViewOptions);
  const { hasNextPage, isFetching, isFetchNextPageError, fetchNextPage } =
    result;

  // `isFetching` is a dependency so that the next page is fetched again when
  // the sentinel stays in view after a page loads (a short page).
  useEffect(() => {
    if (inView && hasNextPage && !isFetching && !isFetchNextPageError) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);

  return withRef(result, ref);
}

/**
 * Adds `ref` to the query result without reading or changing the result.
 *
 * A spread (`{ ...result, ref }`) reads every property, which turns off
 * TanStack Query's tracked properties, so the component would re-render on
 * any change. `Object.assign` would write to the observer's internal result
 * object. A proxy reads each property only when the caller reads it.
 */
function withRef<T extends object, TRef>(result: T, ref: TRef) {
  return new Proxy(result, {
    get: (target, key) => (key === "ref" ? ref : Reflect.get(target, key)),
    has: (target, key) => key === "ref" || Reflect.has(target, key),
    ownKeys: (target) => [...Reflect.ownKeys(target), "ref"],
    getOwnPropertyDescriptor: (target, key) =>
      key === "ref"
        ? { value: ref, enumerable: true, configurable: true, writable: false }
        : Reflect.getOwnPropertyDescriptor(target, key),
  }) as T & { ref: TRef };
}

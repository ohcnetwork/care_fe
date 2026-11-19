import careConfig from "@careConfig";

import {
  ApiCallOptions,
  ApiRoute,
  HTTPError,
  PaginatedResponse,
} from "@/Utils/request/types";
import { getResponseBody, makeHeaders, makeUrl } from "@/Utils/request/utils";
import { sleep } from "@/Utils/utils";

export async function callApi<Route extends ApiRoute<unknown, unknown>>(
  { baseUrl, path, method, noAuth, defaultQueryParams }: Route,
  options?: ApiCallOptions<Route>,
): Promise<Route["TRes"]> {
  const url = `${baseUrl ?? careConfig.apiUrl}${makeUrl(
    path,
    {
      ...(defaultQueryParams ?? {}),
      ...options?.queryParams,
    },
    options?.pathParams,
  )}`;

  const isFormData = options?.body instanceof FormData;

  const fetchOptions: RequestInit = {
    method,
    headers: makeHeaders(noAuth ?? false, options?.headers, isFormData),
    signal: options?.signal,
  };

  if (options?.body) {
    if (isFormData) {
      fetchOptions.body = options.body as FormData;
    } else {
      fetchOptions.body = JSON.stringify(options.body);
    }
  }

  let res: Response;

  try {
    res = await fetch(url, fetchOptions);
  } catch (error) {
    throw new Error("Network Error", { cause: error });
  }

  const data = await getResponseBody<Route["TRes"]>(res);

  if (!res.ok) {
    const isSilent =
      typeof options?.silent === "function"
        ? options.silent(res)
        : (options?.silent ?? false);

    throw new HTTPError({
      message: "Request Failed",
      status: res.status,
      silent: isSilent,
      cause: data as unknown as Record<string, unknown>,
    });
  }

  return data;
}

/**
 * Creates a TanStack Query compatible query function.
 *
 * Example:
 * ```tsx
 * const { data, isLoading } = useQuery({
 *   queryKey: ["prescription", consultationId],
 *   queryFn: query(MedicineRoutes.prescription, {
 *     pathParams: { consultationId },
 *     queryParams: {
 *       limit: 10,
 *       offset: 0,
 *     },
 *   }),
 * });
 * ```
 */
export default function query<Route extends ApiRoute<unknown, unknown>>(
  route: Route,
  options?: ApiCallOptions<Route>,
) {
  return ({ signal }: { signal: AbortSignal }) => {
    return callApi(route, { ...options, signal });
  };
}

/**
 * Creates a debounced TanStack Query compatible query function.
 *
 * Example:
 * ```tsx
 * const { data, isLoading } = useQuery({
 *   queryKey: ["patient-search", facilityId, search],
 *   queryFn: query.debounced(patientsApi.search, {
 *     pathParams: { facilityId },
 *     queryParams: { limit: 10, offset: 0, search },
 *   }),
 * });
 * ```
 *
 * The debounced query leverages TanStack Query's built-in cancellation through
 * `AbortSignal`. Here's how it works:
 *
 * 1. When a new query is triggered, TanStack Query automatically creates an
 * `AbortSignal`
 * 2. If a new query starts before the debounce delay finishes:
 *    - The previous signal is aborted automatically by TanStack Query
 *    - The previous `sleep` promise is cancelled
 *    - A new debounce timer starts
 *
 * No explicit cleanup is needed because:
 * - The `AbortSignal` is passed through to the underlying `fetch` call
 * - When aborted, both the `sleep` promise and the fetch request are cancelled automatically
 * - TanStack Query handles the abortion and cleanup of previous in-flight requests
 */
const debouncedQuery = <Route extends ApiRoute<unknown, unknown>>(
  route: Route,
  options?: ApiCallOptions<Route> & { debounceInterval?: number },
) => {
  return async ({ signal }: { signal: AbortSignal }) => {
    await sleep(options?.debounceInterval ?? 500);
    return query(route, { ...options })({ signal });
  };
};
query.debounced = debouncedQuery;

/**
 * Creates a TanStack Query compatible paginated query function.
 *
 * This function is useful for fetching paginated data from an API.
 * It will fetch all pages of data and return a single array of results.
 *
 * To disable pagination, set the `maxPages` option to `1`.
 * Leaving it unset will fetch all pages.
 *
 * Example:
 * ```tsx
 * const { data, isLoading } = useQuery({
 *   queryKey: ["patient-search", facilityId, search],
 *   queryFn: query.paginated(patientsApi.search, {
 *     pathParams: { facilityId },
 *     queryParams: { limit: 10, offset: 0, search },
 *   }),
 * });
 * ```
 */
const paginatedQuery = <
  Route extends ApiRoute<PaginatedResponse<unknown>, unknown>,
>(
  route: Route,
  options?: ApiCallOptions<Route> & { pageSize?: number; maxPages?: number },
) => {
  return async ({ signal }: { signal: AbortSignal }) => {
    const items: Route["TRes"]["results"] = [];
    let hasNextPage = true;
    let page = 0;
    let count = 0;

    const pageSize =
      options?.pageSize ?? careConfig.pagination.limitOffset.maxLimit;

    while (hasNextPage) {
      const res = await query(route, {
        ...options,
        queryParams: {
          limit: pageSize,
          offset: page * pageSize,
          ...options?.queryParams,
        },
      })({ signal });

      count = res.count;
      items.push(...res.results);

      if (options?.maxPages && page >= options.maxPages - 1) {
        hasNextPage = false;
      }

      if (items.length >= res.count) {
        hasNextPage = false;
      }

      page++;
    }

    return {
      count,
      results: items,
    };
  };
};
query.paginated = paginatedQuery;

/**
 * Default page size for {@link query.infinite}.
 */
export const DEFAULT_INFINITE_PAGE_SIZE = 20;

/**
 * Computes the offset of the next page for limit-offset pagination.
 *
 * The next offset is the last offset plus the number of items that the
 * server actually returned, so it stays correct even if the server returns
 * fewer items than the requested `limit`. An empty page stops the pagination,
 * so an inconsistent `count` cannot cause an endless loop of requests.
 */
function getNextOffset(
  lastPage: PaginatedResponse<unknown>,
  _allPages: unknown,
  lastOffset: number,
) {
  const nextOffset = lastOffset + lastPage.results.length;
  return lastPage.results.length > 0 && nextOffset < lastPage.count
    ? nextOffset
    : undefined;
}

/**
 * Creates the TanStack Query infinite query options (`queryFn`,
 * `initialPageParam` and `getNextPageParam`) for a limit-offset paginated
 * route. Spread the result into `useInfiniteQuery` or
 * {@link import("@/hooks/useInfiniteList").useInfiniteList}.
 *
 * The `limit` and `offset` query params are set for each page. Do not pass
 * them in `queryParams`.
 *
 * Set `debounceInterval` to debounce the first page (for example, for search
 * inputs). The next pages are fetched without delay.
 *
 * Example:
 * ```tsx
 * const { data, ref } = useInfiniteList({
 *   queryKey: ["users", search],
 *   ...query.infinite(userApi.list, {
 *     queryParams: { search_text: search },
 *     pageSize: 15,
 *     debounceInterval: 500,
 *   }),
 * });
 * ```
 */
const infiniteQuery = <
  Route extends ApiRoute<PaginatedResponse<unknown>, unknown>,
>(
  route: Route,
  options?: ApiCallOptions<Route> & {
    pageSize?: number;
    debounceInterval?: number;
  },
) => {
  const {
    pageSize = DEFAULT_INFINITE_PAGE_SIZE,
    debounceInterval,
    ...apiOptions
  } = options ?? {};

  return {
    initialPageParam: 0,
    queryFn: async ({
      pageParam,
      signal,
    }: {
      pageParam: number;
      signal: AbortSignal;
    }): Promise<Route["TRes"]> => {
      if (debounceInterval && pageParam === 0) {
        await sleep(debounceInterval);
      }
      return callApi(route, {
        ...apiOptions,
        signal,
        queryParams: {
          ...apiOptions.queryParams,
          limit: pageSize,
          offset: pageParam,
        },
      } as ApiCallOptions<Route>);
    },
    getNextPageParam: getNextOffset,
  };
};
query.infinite = infiniteQuery;

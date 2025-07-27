import careConfig from "@careConfig";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";

import {
  ApiCallOptions,
  ApiRoute,
  HTTPError,
  PaginatedResponse,
} from "@/Utils/request/types";
import { getResponseBody, makeHeaders, makeUrl } from "@/Utils/request/utils";
import { sleep } from "@/Utils/utils";

export async function callApi<Route extends ApiRoute<unknown, unknown>>(
  { baseUrl, path, method, noAuth }: Route,
  options?: ApiCallOptions<Route>,
): Promise<Route["TRes"]> {
  const url = `${baseUrl ?? careConfig.apiUrl}${makeUrl(path, options?.queryParams, options?.pathParams)}`;

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
  } catch {
    throw new Error("Network Error");
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

    const pageSize = options?.pageSize ?? RESULTS_PER_PAGE_LIMIT;

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

import careConfig from "@careConfig";

import { getResponseBody } from "@/Utils/request/request";
import { APICallOptions, HTTPError, Route } from "@/Utils/request/types";
import { makeHeaders, makeUrl } from "@/Utils/request/utils";
import { sleep } from "@/Utils/utils";

export async function callApi<TData, TBody>(
  { path, method, noAuth }: Route<TData, TBody>,
  options?: APICallOptions<TBody>,
): Promise<TData> {
  const url = `${careConfig.apiUrl}${makeUrl(path, options?.queryParams, options?.pathParams)}`;

  const fetchOptions: RequestInit = {
    method,
    headers: makeHeaders(noAuth ?? false, options?.headers),
    signal: options?.signal,
  };

  if (options?.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  let res: Response;

  try {
    res = await fetch(url, fetchOptions);
  } catch {
    throw new Error("Network Error");
  }

  const data = await getResponseBody<TData>(res);

  if (!res.ok) {
    throw new HTTPError({
      message: "Request Failed",
      status: res.status,
      silent: options?.silent ?? false,
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
export default function query<TData, TBody>(
  route: Route<TData, TBody>,
  options?: APICallOptions<TBody>,
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
const debouncedQuery = <TData, TBody>(
  route: Route<TData, TBody>,
  options?: APICallOptions<TBody> & { debounceInterval?: number },
) => {
  return async ({ signal }: { signal: AbortSignal }) => {
    await sleep(options?.debounceInterval ?? 500);
    return query(route, { ...options })({ signal });
  };
};
query.debounced = debouncedQuery;

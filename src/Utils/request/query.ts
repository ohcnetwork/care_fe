import careConfig from "@careConfig";

import { getResponseBody } from "@/Utils/request/request";
import { HTTPError, QueryOptions, Route } from "@/Utils/request/types";
import { makeHeaders, makeUrl } from "@/Utils/request/utils";

async function queryRequest<TData, TBody>(
  { path, method, noAuth }: Route<TData, TBody>,
  options?: QueryOptions<TBody>,
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
 * Creates a TanStack Query compatible request function
 */
export default function query<TData, TBody>(
  route: Route<TData, TBody>,
  options?: QueryOptions<TBody>,
) {
  return ({ signal }: { signal: AbortSignal }) => {
    return queryRequest(route, { ...options, signal });
  };
}

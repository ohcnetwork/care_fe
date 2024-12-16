import careConfig from "@careConfig";

import { QueryError } from "@/Utils/request/queryError";
import { getResponseBody } from "@/Utils/request/request";
import { Route } from "@/Utils/request/types";
// Remove conflicting QueryOptions import
import { makeHeaders, makeUrl } from "@/Utils/request/utils";

// Define QueryOptions locally, including the 'headers' property
export interface QueryOptions<TBody> {
  body?: TBody;
  queryParams?: Record<string, any>;
  pathParams?: Record<string, any>;
  silent?: boolean;
  signal?: AbortSignal;
  headers?: Record<string, string>; // Add headers support
}

async function queryRequest<TData, TBody>(
  { path, method, noAuth }: Route<TData, TBody>,
  options?: QueryOptions<TBody>,
): Promise<TData> {
  const url = `${careConfig.apiUrl}${makeUrl(path, options?.queryParams, options?.pathParams)}`;

  // Create a Headers object from the default headers
  const defaultHeaders = makeHeaders(noAuth ?? false);

  // If custom headers are provided, append them to the default headers
  if (options?.headers) {
    const customHeaders = new Headers(options.headers);
    customHeaders.forEach((value, key) => {
      // Use append() to add new header values without overwriting existing ones
      defaultHeaders.append(key, value);
    });
  }

  const fetchOptions: RequestInit = {
    method,
    headers: defaultHeaders, // Headers API object directly used
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
    throw new QueryError({
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

import careConfig from "@careConfig";

import { QueryError } from "@/Utils/request/queryError";
import { getResponseBody } from "@/Utils/request/request";
import { QueryOptions, Route } from "@/Utils/request/types";
import { makeHeaders, makeUrl } from "@/Utils/request/utils";

/**
 * Extend the QueryOptions interface to include customHeaders
 * @template TBody - The type of the request body
 */
export interface QueryOptionsWithHeaders<TBody> extends QueryOptions<TBody> {
  customHeaders?: Record<string, string>;
  headers?: HeadersInit;
}

// Function to sanitize custom headers
const sanitizeHeaders = (headers: Record<string, string>) => {
  const sanitized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    // Ensure header names follow RFC 7230 and values are safe
    if (
      /^[!#$%&'*+-.^_`|~0-9a-zA-Z]+$/.test(key) &&
      typeof value === "string" && // Changed 'string' to "string"
      !value.includes("\n") && // Changed '\n' to "\n"
      !value.includes("\r")
    ) {
      // Changed '\r' to "\r"
      sanitized[key] = value;
    }
  }
  return sanitized;
};

async function queryRequest<TData, TBody>(
  { path, method, noAuth }: Route<TData, TBody>,
  options?: QueryOptionsWithHeaders<TBody>,
): Promise<TData> {
  const url = `${careConfig.apiUrl}${makeUrl(path, options?.queryParams, options?.pathParams)}`;

  // Merge default headers with sanitized custom headers
  const defaultHeaders = makeHeaders(noAuth ?? false);
  const customHeaders = sanitizeHeaders(options?.customHeaders || {});
  const headers = { ...defaultHeaders, ...customHeaders }; // Merging headers manually

  const fetchOptions: RequestInit = {
    method,
    headers,
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
 * @template TData - The type of the response data
 * @template TBody - The type of the request body
 */
export default function query<TData, TBody>(
  route: Route<TData, TBody>,
  options?: QueryOptionsWithHeaders<TBody>,
): (params: { signal: AbortSignal }) => Promise<TData> {
  return ({ signal }) => {
    return queryRequest(route, { ...options, signal });
  };
}

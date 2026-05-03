/**
 * Represents the possible values for a query parameter.
 */
type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean | null | undefined>;

/**
 * Represents a collection of query parameters.
 */
export type QueryParams = Record<string, QueryParamValue>;

/**
 * Represents an API route definition.
 *
 * @template TRes - The type of the response data.
 * @template TBody - The type of the request body (defaults to `unknown`).
 * @template TQuery - The type of the query parameters (defaults to `QueryParams`).
 */
export interface ApiRoute<
  TRes,
  TBody = unknown,
  TQuery extends QueryParams = QueryParams,
> {
  /** The base URL for the API (optional, defaults to careConfig.apiUrl). */
  baseUrl?: string;
  /** The HTTP method for the request. */
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** The type of the request body. */
  TBody?: TBody;
  /** The type of the query parameters. */
  TQuery?: TQuery;
  /** The URL path, potentially containing placeholders like `{id}`. */
  path: string;
  /** The type of the response data. */
  TRes: TRes;
  /** Whether to skip authentication for this route. */
  noAuth?: boolean;
  /** Default query parameters to include in every request to this route. */
  defaultQueryParams?: TQuery;
}

/**
 * Extracts parameter names from a path string (e.g., "id" from "/api/{id}").
 */
type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}{${infer Param}}${infer Rest}`
    ? Param | ExtractRouteParams<Rest>
    : never;

/**
 * Represents the path parameters for a given route.
 */
type PathParams<T extends string> = {
  [_ in ExtractRouteParams<T>]: string;
};

/**
 * Derives the query parameter type from an ApiRoute.
 */
export type RouteQueryParams<
  Route extends ApiRoute<unknown, unknown, unknown>,
> = NonNullable<Route["TQuery"]>;

/**
 * Options for making an API call.
 *
 * @template Route - The API route definition.
 */
export interface ApiCallOptions<
  Route extends ApiRoute<unknown, unknown, unknown>,
> {
  /** Parameters to replace placeholders in the route path. */
  pathParams?: PathParams<Route["path"]>;
  /** Query parameters to append to the URL. */
  queryParams?: RouteQueryParams<Route>;
  /** The request body. */
  body?: Route["TBody"];
  /** Whether to suppress error toasts for this request. */
  silent?: boolean | ((response: Response) => boolean);
  /** An AbortSignal to cancel the request. */
  signal?: AbortSignal;
  /** Additional headers to include in the request. */
  headers?: HeadersInit;
}

/**
 * Represents a structured error response from the API, typically for validation errors.
 */
export type StructuredError = Record<string, string | string[]>;

/**
 * Represents the cause of an HTTP error.
 */
type HTTPErrorCause = StructuredError | Record<string, unknown> | undefined;

/**
 * Custom error class for HTTP failures.
 */
export class HTTPError extends Error {
  /** The HTTP status code. */
  status: number;
  /** Whether the error should be handled silently (no UI notification). */
  silent: boolean;
  /** The cause of the error, often the parsed response body. */
  cause?: HTTPErrorCause;

  constructor({
    message,
    status,
    silent,
    cause,
  }: {
    message: string;
    status: number;
    silent: boolean;
    cause?: Record<string, unknown>;
  }) {
    super(message, { cause });
    this.status = status;
    this.silent = silent;
    this.cause = cause;
  }
}

/**
 * Represents a paginated response from the API.
 *
 * @template TItem - The type of items in the results array.
 */
export interface PaginatedResponse<TItem> {
  /** The total number of items available across all pages. */
  count: number;
  /** The items for the current page. */
  results: TItem[];
}

/**
 * Represents a request body for an upsert operation.
 */
export interface UpsertRequest<TCreate, TUpdate> {
  /** The data points to create or update. */
  datapoints: (TCreate | (TUpdate & { id: string }))[];
}

/**
 * A fake function that returns an empty object casted to type T.
 * Used primarily for defining generic types in API route definitions.
 *
 * @returns Empty object as type T.
 */
export function Type<T>(): T {
  return {} as T;
}

/**
 * Supported HTTP methods.
 */
export enum HttpMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  PATCH = "PATCH",
  DELETE = "DELETE",
}

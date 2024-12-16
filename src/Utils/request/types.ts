type QueryParamValue = string | number | boolean | null | undefined;

export type QueryParams = Record<string, QueryParamValue>;

interface RouteBase<TData> {
  path: string;
  TRes: TData;
  noAuth?: boolean;
}

export interface QueryRoute<TData> extends RouteBase<TData> {
  method?: "GET";
}

export interface MutationRoute<TData, TBody> extends RouteBase<TData> {
  method: "POST" | "PUT" | "PATCH" | "DELETE";
  TBody?: TBody;
}

export type Route<TData, TBody> =
  | QueryRoute<TData>
  | MutationRoute<TData, TBody>;

export interface RequestResult<TData> {
  res: Response | undefined;
  data: TData | undefined;
  error: undefined | Record<string, unknown>;
}

export interface RequestOptions<TData = unknown, TBody = unknown> {
  query?: QueryParams;
  body?: TBody;
  pathParams?: Record<string, string | number>;
  onResponse?: (res: RequestResult<TData>) => void;
  silent?: boolean;
}

export interface APICallOptions<TBody = unknown> {
  pathParams?: Record<string, string | number>;
  queryParams?: QueryParams;
  body?: TBody;
  silent?: boolean;
  signal?: AbortSignal;
  headers?: HeadersInit;
}

type HTTPErrorCause = Record<string, unknown> | undefined;

export class HTTPError extends Error {
  status: number;
  silent: boolean;
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

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: HTTPError;
  }
}

export interface PaginatedResponse<TItem> {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
}

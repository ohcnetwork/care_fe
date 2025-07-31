type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean | null | undefined>;

export type QueryParams = Record<string, QueryParamValue>;

export interface ApiRoute<TData, TBody = unknown> {
  baseUrl?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  TBody?: TBody;
  path: string;
  TRes: TData;
  noAuth?: boolean;
}

type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}{${infer Param}}${infer Rest}`
    ? Param | ExtractRouteParams<Rest>
    : never;

type PathParams<T extends string> = {
  [_ in ExtractRouteParams<T>]: string;
};

export interface ApiCallOptions<Route extends ApiRoute<unknown, unknown>> {
  pathParams?: PathParams<Route["path"]>;
  queryParams?: QueryParams;
  body?: Route["TBody"];
  silent?: boolean | ((response: Response) => boolean);
  signal?: AbortSignal;
  headers?: HeadersInit;
}

export type StructuredError = Record<string, string | string[]>;

type HTTPErrorCause = StructuredError | Record<string, unknown> | undefined;

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

export interface PaginatedResponse<TItem> {
  count: number;
  results: TItem[];
}

export interface UpsertRequest<TCreate, TUpdate> {
  datapoints: (TCreate | (TUpdate & { id: string }))[];
}

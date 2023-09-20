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

export interface MutationRoute<TData> extends RouteBase<TData> {
  method: "POST" | "PUT" | "PATCH" | "DELETE";
}

export type Route<TData> = QueryRoute<TData> | MutationRoute<TData>;

export interface RequestResult<TData> {
  res: Response | undefined;
  data: TData | undefined;
  error: undefined | Record<string, unknown>;
}

export interface RequestOptions<TData = unknown> {
  query?: QueryParams;
  body?: object;
  pathParams?: Record<string, string>;
  onResponse?: (res: RequestResult<TData>) => void;
  silent?: boolean;
  reattempts?: number;
}

export interface PaginatedResponse<TItem> {
  count: number;
  next: string | null;
  previous: string | null;
  results: TItem[];
}

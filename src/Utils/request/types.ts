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

export interface RequestOptions {
  query?: QueryParams;
  body?: object;
  pathParams?: Record<string, string>;
}

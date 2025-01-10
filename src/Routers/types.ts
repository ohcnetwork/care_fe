// Helper type to extract path parameters from a route string
type ExtractRouteParams<T extends string> = string extends T
  ? Record<string, string>
  : T extends `${string}:${infer Param}/${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
    : T extends `${string}:${infer Param}`
      ? { [K in Param]: string }
      : Record<string, never>;

// RouteFunction type that works with Raviger
export type RouteFunction<T extends string> = (
  params: ExtractRouteParams<T>,
) => JSX.Element;

export type AppRoutes = {
  [Route in string]: RouteFunction<Route>;
};

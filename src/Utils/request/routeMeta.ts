import type { ApiCallOptions, ApiRoute } from "@/Utils/request/types";

/**
 * Tag attached to functions returned by `mutate` / `query` so the hooks
 * can find their route and look up an override.
 */
const ROUTE_META = Symbol.for("care.request.routeMeta");

export interface RouteMeta<Route extends ApiRoute<unknown, unknown>> {
  route: Route;
  pathParams?: ApiCallOptions<Route>["pathParams"];
  queryParams?: ApiCallOptions<Route>["queryParams"];
}

export function attachRouteMeta<
  F extends (...args: never[]) => unknown,
  Route extends ApiRoute<unknown, unknown>,
>(fn: F, meta: RouteMeta<Route>): F {
  (fn as unknown as { [ROUTE_META]: RouteMeta<Route> })[ROUTE_META] = meta;
  return fn;
}

export function getRouteMeta(
  fn: unknown,
): RouteMeta<ApiRoute<unknown, unknown>> | undefined {
  if (typeof fn !== "function") return undefined;
  return (fn as { [ROUTE_META]?: RouteMeta<ApiRoute<unknown, unknown>> })[
    ROUTE_META
  ];
}

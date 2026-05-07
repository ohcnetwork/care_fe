import { callApi } from "@/Utils/request/query";
import { attachRouteMeta } from "@/Utils/request/routeMeta";
import { ApiCallOptions, ApiRoute } from "@/Utils/request/types";

/**
 * Builds a `mutationFn` for `useApiMutation`. The returned function is
 * tagged with its route so plugs can override it.
 */
export default function mutate<Route extends ApiRoute<unknown, unknown>>(
  route: Route,
  options?: ApiCallOptions<Route>,
) {
  const fn = (variables: Route["TBody"]) =>
    callApi(route, { ...options, body: variables });
  return attachRouteMeta(fn, {
    route,
    pathParams: options?.pathParams,
    queryParams: options?.queryParams,
  });
}

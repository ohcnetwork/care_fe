import { getResponseBody } from "@/Utils/request/request";
import { Route } from "@/Utils/request/types";
import { makeHeaders } from "@/Utils/request/utils";

const apiRequest = <TData, TBody>(route: Route<TData, TBody>) => {
  return async ({ signal }: { signal: AbortSignal }) => {
    const headers = makeHeaders(route.noAuth ?? false);

    const res = await fetch(route.path, {
      method: route.method,
      headers,
      signal,
    });

    return getResponseBody<TData>(res);
  };
};

const api = {
  request: apiRequest,
};

export default api;

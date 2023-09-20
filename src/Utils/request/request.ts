import handleResponse from "./handleResponse";
import { RequestOptions, RequestResult, Route } from "./types";
import { makeHeaders, makeUrl } from "./utils";

interface Options extends RequestOptions {
  controller?: AbortController;
}

export default async function request<TData>(
  { path, method, noAuth }: Route<TData>,
  {
    query,
    body,
    pathParams,
    controller,
    onResponse,
    silent,
    reattempts = 3,
  }: Options = {}
): Promise<RequestResult<TData>> {
  const signal = controller?.signal;
  const url = makeUrl(path, query, pathParams);

  const options: RequestInit = { method, signal };

  if (body) {
    options.body = JSON.stringify(body);
  }

  let result: RequestResult<TData> = {
    res: undefined,
    data: undefined,
    error: undefined,
  };

  for (let i = 0; i < reattempts + 1; i++) {
    options.headers = makeHeaders(noAuth ?? false);

    try {
      const res = await fetch(url, options);
      const data: TData = await res.json();

      result = {
        res,
        data: res.ok ? data : undefined,
        error: res.ok ? undefined : (data as Record<string, unknown>),
      };

      onResponse?.(result);
      handleResponse(result, silent);

      return result;
    } catch (error: any) {
      result = { error, res: undefined, data: undefined };
    }
  }

  console.error(
    `Request failed after ${reattempts + 1} attempts`,
    result.error
  );
  return result;
}

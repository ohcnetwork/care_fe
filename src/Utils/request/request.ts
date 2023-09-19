import handleResponse from "./handleResponse";
import { RequestOptions, RequestResult, Route } from "./types";
import { makeHeaders, makeUrl } from "./utils";

interface Options extends RequestOptions {
  controller?: AbortController;
}

export default async function request<TData>(
  { path, method, noAuth }: Route<TData>,
  { query, body, pathParams, controller, onResponse, silent }: Options = {}
): Promise<RequestResult<TData>> {
  const signal = controller?.signal;

  const headers = makeHeaders(noAuth ?? false);
  const url = makeUrl(path, query, pathParams);

  const options: RequestInit = { headers, method, signal };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    const data: TData = await res.json();

    const result = {
      res,
      data: res.ok ? data : undefined,
      error: res.ok ? undefined : (data as Record<string, unknown>),
    };

    onResponse?.(result);
    handleResponse(result, silent);

    return result;
  } catch (error: any) {
    console.error(error);
    return { error, res: undefined, data: undefined };
  }
}

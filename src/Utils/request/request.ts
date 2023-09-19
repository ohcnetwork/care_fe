import { RequestOptions, Route } from "./types";
import { makeHeaders, makeUrl } from "./utils";

interface Options extends RequestOptions {
  controller?: AbortController;
}

export default async function request<TData>(
  { path, method, noAuth }: Route<TData>,
  { query, body, pathParams, controller }: Options = {}
) {
  const signal = controller?.signal;

  const headers = makeHeaders(noAuth ?? false);
  const url = makeUrl(path, query, pathParams);

  const options: RequestInit = { headers, method, signal };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const data: TData = await res.json();

  return { res, data };
}

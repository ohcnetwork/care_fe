/**
 * API route override registry.
 *
 * Lets plugs wrap or replace specific API calls (`mutate` / `query`)
 * without touching any UI. Routes are matched by `${METHOD} ${path}` so
 * plugs can register against their own duplicate route definitions.
 *
 * The registry is exposed on `window.__careApiOverrides` so plugs loaded
 * via Module Federation can register without importing host modules.
 */
import type { ApiCallOptions, ApiRoute } from "@/Utils/request/types";

type Route = ApiRoute<unknown, unknown>;

export interface ApiOverrideContext<R extends Route> {
  pathParams?: ApiCallOptions<R>["pathParams"];
  queryParams?: ApiCallOptions<R>["queryParams"];
  body?: R["TBody"];
  signal?: AbortSignal;
  /** `window.location.pathname` at the time the request was issued. */
  pathname?: string;
}

export type ApiOverrideFn<R extends Route> = (
  ctx: ApiOverrideContext<R>,
  next: () => Promise<R["TRes"]>,
) => Promise<R["TRes"]>;

const registry = new Map<string, ApiOverrideFn<Route>>();

const keyOf = (route: { path: string; method?: string }) =>
  `${(route.method ?? "GET").toUpperCase()} ${route.path}`;

export function addApiOverride<R extends Route>(
  route: R,
  fn: ApiOverrideFn<R>,
): () => void {
  const key = keyOf(route);
  if (registry.has(key)) {
    console.warn(`[override] replacing existing override for "${key}"`);
  }
  const stored = fn as unknown as ApiOverrideFn<Route>;
  registry.set(key, stored);

  return () => {
    if (registry.get(key) === stored) {
      registry.delete(key);
    }
  };
}

export function getApiOverride<R extends Route>(
  route: R,
): ApiOverrideFn<R> | undefined {
  return registry.get(keyOf(route)) as ApiOverrideFn<R> | undefined;
}

export function clearApiOverrides(): void {
  registry.clear();
}

declare global {
  interface Window {
    __careApiOverrides?: {
      add: typeof addApiOverride;
      clear: typeof clearApiOverrides;
    };
  }
}

if (typeof window !== "undefined") {
  window.__careApiOverrides = {
    add: addApiOverride,
    clear: clearApiOverrides,
  };
}

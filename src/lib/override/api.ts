import type {
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";

import type { ApiRoute } from "@/Utils/request/types";

/**
 * Registry of per-route overrides for `useApiMutation` / `useApiQuery`.
 * Plugs register via `window.__careOverrides`; an override returns
 * replacement options, or `null` to pass through.
 */

export interface ApiOverrideContext {
  pathname: string;
  pathParams: Record<string, string | number | undefined>;
  queryParams: Record<string, string | number | boolean | undefined>;
}

export type MutationOverride<R extends ApiRoute<unknown, unknown>> = (
  hostOptions: UseMutationOptions<R["TRes"], Error, R["TBody"]>,
  ctx: ApiOverrideContext,
) => UseMutationOptions<R["TRes"], Error, R["TBody"]> | null | undefined;

export type QueryOverride<R extends ApiRoute<unknown, unknown>> = (
  hostOptions: UseQueryOptions<R["TRes"], Error>,
  ctx: ApiOverrideContext,
) => UseQueryOptions<R["TRes"], Error> | null | undefined;

type AnyMutationOverride = MutationOverride<ApiRoute<unknown, unknown>>;
type AnyQueryOverride = QueryOverride<ApiRoute<unknown, unknown>>;

const mutationOverrides = new Map<string, AnyMutationOverride>();
const queryOverrides = new Map<string, AnyQueryOverride>();

const keyOf = (route: ApiRoute<unknown, unknown>) =>
  `${route.method ?? "GET"} ${route.path}`;

export function addMutationOverride<R extends ApiRoute<unknown, unknown>>(
  route: R,
  override: MutationOverride<R>,
): () => void {
  const key = keyOf(route);
  mutationOverrides.set(key, override as AnyMutationOverride);
  return () => {
    if (mutationOverrides.get(key) === (override as AnyMutationOverride)) {
      mutationOverrides.delete(key);
    }
  };
}

export function addQueryOverride<R extends ApiRoute<unknown, unknown>>(
  route: R,
  override: QueryOverride<R>,
): () => void {
  const key = keyOf(route);
  queryOverrides.set(key, override as AnyQueryOverride);
  return () => {
    if (queryOverrides.get(key) === (override as AnyQueryOverride)) {
      queryOverrides.delete(key);
    }
  };
}

export function getMutationOverride<R extends ApiRoute<unknown, unknown>>(
  route: R,
): MutationOverride<R> | undefined {
  return mutationOverrides.get(keyOf(route)) as MutationOverride<R> | undefined;
}

export function getQueryOverride<R extends ApiRoute<unknown, unknown>>(
  route: R,
): QueryOverride<R> | undefined {
  return queryOverrides.get(keyOf(route)) as QueryOverride<R> | undefined;
}

export function clearOverrides(): void {
  mutationOverrides.clear();
  queryOverrides.clear();
}

/** Bridge for federated plugs. */
declare global {
  interface Window {
    __careOverrides?: {
      addMutation: (
        route: ApiRoute<unknown, unknown>,
        override: AnyMutationOverride,
      ) => () => void;
      addQuery: (
        route: ApiRoute<unknown, unknown>,
        override: AnyQueryOverride,
      ) => () => void;
    };
  }
}

if (typeof window !== "undefined") {
  window.__careOverrides = {
    addMutation: (route, override) => addMutationOverride(route, override),
    addQuery: (route, override) => addQueryOverride(route, override),
  };
}

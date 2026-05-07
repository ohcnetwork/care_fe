import {
  UseMutationOptions,
  UseMutationResult,
  useMutation,
} from "@tanstack/react-query";

import { getMutationOverride } from "@/lib/override/api";
import { getRouteMeta } from "@/Utils/request/routeMeta";

/**
 * `useMutation` with plug overrides. Same signature as TanStack's hook;
 * if `mutationFn` came from `mutate(route, …)` and a plug has registered
 * an override for that route, the override's options run instead.
 */
export function useApiMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const meta = getRouteMeta(options.mutationFn);
  const override = meta ? getMutationOverride(meta.route) : undefined;

  // Registry types are erased to `ApiRoute<unknown, unknown>`; cast back here.
  const replacement =
    override && meta
      ? (override(
          options as unknown as Parameters<NonNullable<typeof override>>[0],
          {
            pathname:
              typeof window !== "undefined" ? window.location.pathname : "",
            pathParams: (meta.pathParams ?? {}) as Record<
              string,
              string | number | undefined
            >,
            queryParams: (meta.queryParams ?? {}) as Record<
              string,
              string | number | boolean | undefined
            >,
          },
        ) as
          | UseMutationOptions<TData, TError, TVariables, TContext>
          | null
          | undefined)
      : undefined;

  return useMutation(replacement ?? options);
}

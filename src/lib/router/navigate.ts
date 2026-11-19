import type { NavigateOptions, RegisteredRouter } from "@tanstack/react-router";

import { getRouter } from "@/compat/routerRef";

/**
 * Typed `navigate` for code that runs outside a component, such as an event
 * handler or a mutation callback. The `to` and `params` options are checked
 * against the route tree. The codemod `scripts/codemods/raviger-to-tanstack.js`
 * writes calls to this function.
 *
 * It keeps the behavior of the raviger shim `navigate()`:
 * - It returns at once, and the new URL is in `window.location` when it
 *   returns.
 * - It ignores a navigation to the URL that the router already moves to. Some
 *   pages call `navigate()` during render. Without this check, each render
 *   would start the same navigation again, and the load would never finish.
 *
 * @example
 * navigate({ to: "/facility/$facilityId/settings", params: { facilityId } });
 */
export function navigate<
  TTo extends string | undefined = undefined,
  TFrom extends string = string,
  TMaskFrom extends string = TFrom,
  TMaskTo extends string = "",
>(
  options: NavigateOptions<RegisteredRouter, TFrom, TTo, TMaskFrom, TMaskTo>,
): void {
  const router = getRouter();
  // `getRouter()` returns an untyped router. `options` is already checked.
  const target = router.buildLocation(options as never).href;
  const rendered = router.state.resolvedLocation ?? router.state.location;
  if (target === router.latestLocation.href && target !== rendered.href) {
    return;
  }
  void router.navigate(options);
  // Some code reads `window.location` right after it navigates. The browser
  // history queues the write to a microtask. Flush it now.
  router.history.flush();
}

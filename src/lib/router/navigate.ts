import type {
  HistoryState,
  NavigateOptions,
  RegisteredRouter,
} from "@tanstack/react-router";

import { getRouter } from "@/lib/router/routerRef";

function isAbsoluteUrl(url: string) {
  return /^(?:[a-z][a-z\d+.-]*:)?\/\//i.test(url);
}

/**
 * Makes `href` an app path (`/path?query#hash`). A relative `href`
 * (`questionnaire/123`, `?page=2`) resolves against the current location, as
 * in the browser. The router itself resolves it against the origin.
 *
 * Returns `null` for a URL on another origin.
 */
export function toAppHref(href: string): string | null {
  if (href.startsWith("/") && !href.startsWith("//")) return href;
  const base = window.location.origin + getRouter().history.location.href;
  const url = new URL(href, base);
  if (isAbsoluteUrl(href) && url.origin !== window.location.origin) {
    return null;
  }
  return url.pathname + url.search + url.hash;
}

/** Options to navigate to a URL that is built at runtime. */
export interface HrefNavigateOptions {
  href: string;
  replace?: boolean;
  state?: HistoryState;
  resetScroll?: boolean;
  ignoreBlocker?: boolean;
}

/**
 * `navigate` for code that runs outside a component, such as an event handler
 * or a mutation callback.
 *
 * Give `to` and `params` when the target route is known: the router checks
 * them against the route tree. Give `href` only for a URL that is built at
 * runtime (for example a URL from the API or a `redirect` query param). A
 * relative `href` resolves against the current location. An `href` on
 * another origin loads that page.
 *
 * Unlike `router.navigate`:
 * - It returns at once, and the new URL is in `window.location` when it
 *   returns.
 * - It ignores a navigation to the URL that the router already moves to. Some
 *   pages call `navigate()` during render. Without this check, each render
 *   would start the same navigation again, and the load would never finish.
 *
 * @example
 * navigate({ to: "/facility/$facilityId/settings", params: { facilityId } });
 * navigate({ href: redirectUrl, replace: true });
 */
export function navigate(options: HrefNavigateOptions): void;
export function navigate<
  TTo extends string | undefined = undefined,
  TFrom extends string = string,
  TMaskFrom extends string = TFrom,
  TMaskTo extends string = "",
>(
  options: NavigateOptions<RegisteredRouter, TFrom, TTo, TMaskFrom, TMaskTo>,
): void;
export function navigate(
  options: HrefNavigateOptions | NavigateOptions<RegisteredRouter>,
): void {
  if (options.href !== undefined) {
    const href = toAppHref(options.href);
    if (href === null) {
      window.location.assign(options.href);
      return;
    }
    options = { ...options, href } as NavigateOptions<RegisteredRouter>;
  }
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

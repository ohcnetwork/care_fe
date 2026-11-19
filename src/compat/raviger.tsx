/**
 * raviger compatibility shim.
 *
 * Every `import ... from "raviger"` in core and in plugins resolves here (see
 * the alias in `vite.config.mts` and `paths` in `tsconfig.json`). The shim
 * keeps raviger's API, but:
 *
 * - reads location from the TanStack router state, so legacy route tables
 *   re-render together with the TanStack route tree, and
 * - sends every write (`navigate`, `Link`, `useQueryParams` setters,
 *   `Redirect`, `useRedirect`, `useNavigate`) through `router.navigate`, so
 *   the TanStack history index stays correct and `canGoBack()` is reliable.
 *
 * The matching logic is a port of raviger 5.3 (MIT) so that nested route
 * tables (`useRoutes` with `basePath`) keep their behavior until each area
 * moves to file-based routes.
 */
import {
  type AnyRouter,
  type ParsedLocation,
  useRouterState,
} from "@tanstack/react-router";
import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";

interface HistoryEvent {
  action: { type: string };
}

import type { ActiveLinkProps, LinkProps } from "raviger/dist/Link";
import type {
  LocationChangeOptionParams,
  LocationChangeSetFn,
  NavigationInitiator,
  RavigerHistory,
  RavigerLocation,
} from "raviger/dist/location";
import type { NavigateOptions } from "raviger/dist/navigate";
import type {
  QueryParam,
  setQueryParamsOptions,
} from "raviger/dist/querystring";
import type { RedirectProps, UseRedirectOptions } from "raviger/dist/redirect";
import type {
  PathParamOptions,
  usePathParams as RavigerUsePathParams,
  RouteOptionParams,
  Routes,
} from "raviger/dist/router";

import { getRouter } from "@/compat/routerRef";
import { useNavigationBlocker } from "@/hooks/useNavigationBlocker";
import { isShowingPreviousPage } from "@/lib/router/previousPage";

export type {
  ActiveLinkProps,
  LinkProps,
  LocationChangeOptionParams,
  LocationChangeSetFn,
  NavigateOptions,
  NavigationInitiator,
  PathParamOptions,
  QueryParam,
  RavigerLocation,
  RedirectProps,
  RouteOptionParams,
  Routes,
  setQueryParamsOptions,
};

// ---------------------------------------------------------------------------
// Context (port of raviger `context.ts`)
// ---------------------------------------------------------------------------

const BasePathContext = createContext<string>("");
const PathContext = createContext<string | null>(null);

export function RouterProvider({
  basePath = "",
  path,
  children,
}: {
  basePath?: string;
  path?: string;
  children?: React.ReactNode;
}) {
  return (
    <BasePathContext.Provider value={basePath}>
      <PathContext.Provider value={path ?? null}>
        {children}
      </PathContext.Provider>
    </BasePathContext.Provider>
  );
}

export function useBasePath() {
  return useContext(BasePathContext);
}

// ---------------------------------------------------------------------------
// Location (port of raviger `location.ts` on top of the router state)
// ---------------------------------------------------------------------------

/**
 * The location that legacy readers see.
 *
 * `state.location` moves as soon as a navigation starts (synchronously in
 * `router.navigate`), before the new matches render; `state.resolvedLocation`
 * moves only after they painted.
 *
 * - The new path renders in the same route as the current page (a query
 *   change, or one legacy page to another in the `$` splat): the new
 *   location at once, as with raviger. The page changes in the same render
 *   as the click, and code that writes the query twice in a row merges with
 *   the latest value.
 * - The new path needs a different route: the previous location until the
 *   new matches commit, so legacy route tables do not flash "not found". In
 *   the render that commits the new matches, the new location, so a page
 *   that mounts reads its own query (for example `?tab=versions`).
 */
function useRouterLocation(): ParsedLocation {
  const router = getRouter();
  return useRouterState({
    router,
    select: (state) =>
      isShowingPreviousPage(router, state)
        ? (state.resolvedLocation ?? state.location)
        : state.location,
  });
}

function basePathMatcher(basePath: string) {
  return new RegExp("^" + basePath, "i");
}

function isPathInBase(basePath: string, path: string) {
  return !!(
    basePath &&
    path &&
    path.toLowerCase().startsWith(basePath.toLowerCase())
  );
}

function formatPath(basePath: string, pathname: string): string | null {
  const outsideBase = basePath && !isPathInBase(basePath, pathname);
  if (outsideBase) return null;
  return basePath
    ? pathname.replace(basePathMatcher(basePath), "") || "/"
    : pathname;
}

/** Sync read of the location the history layer is moving to. */
function currentHistoryLocation(router: AnyRouter = getRouter()) {
  return router.history.location;
}

function buildLocation(
  basePath: string,
  initiatedBy?: NavigationInitiator,
): RavigerLocation {
  const { pathname, search, hash, href } = currentHistoryLocation();
  const path = formatPath(basePath, pathname);
  return {
    basePath,
    path,
    pathname: path,
    fullPath: pathname,
    search,
    hash,
    host: window.location.host,
    hostname: window.location.hostname,
    href: window.location.origin + href,
    origin: window.location.origin,
    initiatedBy,
  };
}

function initiatorFromAction(type: string): NavigationInitiator {
  if (type === "PUSH") return "push";
  if (type === "REPLACE") return "replace";
  return "pop";
}

function isPredicateActive(predicate: boolean | (() => boolean)) {
  return typeof predicate === "function" ? predicate() : predicate;
}

export function useLocationChange(
  setFn: LocationChangeSetFn,
  {
    inheritBasePath = true,
    basePath = "",
    isActive,
    onInitial = false,
  }: LocationChangeOptionParams = {},
) {
  const contextBasePath = useBasePath();
  if (inheritBasePath && contextBasePath) basePath = contextBasePath;

  const setRef = useRef(setFn);
  useLayoutEffect(() => {
    setRef.current = setFn;
  });

  useLayoutEffect(() => {
    return getRouter().history.subscribe(({ action }: HistoryEvent) => {
      if (isActive !== undefined && !isPredicateActive(isActive)) return;
      setRef.current(buildLocation(basePath, initiatorFromAction(action.type)));
    });
  }, [basePath, isActive]);

  const mounted = useRef(onInitial);
  useLayoutEffect(() => {
    if (mounted.current) {
      if (isActive === undefined || isPredicateActive(isActive)) {
        setRef.current(buildLocation(basePath));
      }
    } else {
      mounted.current = true;
    }
  }, [basePath, isActive]);
}

export function usePath(basePath?: string): string | null {
  const contextPath = useContext(PathContext);
  const contextBasePath = useBasePath();
  const base = basePath || contextBasePath;
  const { pathname } = useRouterLocation();
  return contextPath || formatPath(base, pathname);
}

export function useFullPath(): string {
  return useRouterLocation().pathname || "/";
}

export function useHash({ stripHash = true } = {}): string {
  const { hash } = useRouterLocation();
  if (stripHash) return hash;
  return hash ? `#${hash}` : "";
}

/** @public raviger API parity for plugins. */
export function useHistory(): RavigerHistory {
  useRouterLocation();
  return {
    scrollRestoration: window.history.scrollRestoration,
    state: window.history.state,
  };
}

// ---------------------------------------------------------------------------
// Matching (port of raviger `router.ts`)
// ---------------------------------------------------------------------------

interface RouteMatcher {
  path: string;
  regex: RegExp;
  props: string[];
}

const paramRegex = /:[a-zA-Z_]+/g;

function createRouteMatcher(path: string): RouteMatcher {
  const escaped = path.replace(/[-\\^$+?.()|[\]{}]/g, "\\$&");
  return {
    path,
    regex: new RegExp(
      `${path.startsWith("*") ? "" : "^"}${escaped
        .replace(paramRegex, "([^/]+)")
        .replace(/\*/g, "")}${path.endsWith("*") ? "" : "$"}`,
      "i",
    ),
    props: (path.match(paramRegex) ?? []).map((p) => p.substring(1)),
  };
}

function useMatchers(paths: string[]) {
  const key = [...paths].sort().join(":");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => paths.map(createRouteMatcher), [key]);
}

const NO_MATCH: [null, null] = [null, null];

function getMatchParams(
  path: string,
  matchers: RouteMatcher[],
): [RouteMatcher, Record<string, string>] | [null, null] {
  let match: RegExpMatchArray | null = null;
  const matcher = matchers.find(({ regex }) => {
    match = path.match(regex);
    return !!match;
  });
  if (!matcher || match === null) return NO_MATCH;
  const found = match as RegExpMatchArray;
  const params = matcher.props.reduce<Record<string, string>>(
    (acc, prop, index) => {
      acc[prop] = found[index + 1];
      return acc;
    },
    {},
  );
  return [matcher, params];
}

function trailingMatch(path: string | null, matchTrailingSlash: boolean) {
  if (path === null) return null;
  if (
    matchTrailingSlash &&
    path &&
    path[path.length - 1] === "/" &&
    path.length > 1
  ) {
    return path.substring(0, path.length - 1);
  }
  return path;
}

type AnyRouteFn = (params: Record<string, unknown>) => React.ReactNode;

export function useRoutes<Path extends string>(
  routes: Routes<Path>,
  {
    basePath = "",
    routeProps = {},
    overridePathParams = true,
    matchTrailingSlash = true,
  }: RouteOptionParams = {},
): React.JSX.Element | null {
  const { pathname } = useRouterLocation();
  const path = formatPath(basePath, pathname);
  const matchPath = trailingMatch(path, matchTrailingSlash);

  const entries = Array.isArray(routes)
    ? (routes as unknown as Array<{ path: string; fn: AnyRouteFn }>)
    : Object.entries(routes as unknown as Record<string, AnyRouteFn>).map(
        ([routePath, fn]) => ({ path: routePath, fn }),
      );
  const matchers = useMatchers(entries.map((entry) => entry.path));

  if (matchPath === null) return null;
  const [matcher, params] = getMatchParams(matchPath, matchers);
  if (!matcher) return null;
  const route = entries.find((entry) => entry.path === matcher.path);
  if (!route) return null;

  const result = route.fn(
    overridePathParams
      ? { ...params, ...routeProps }
      : { ...routeProps, ...params },
  );
  if (result === null || result === undefined) return null;

  return (
    <RouterProvider basePath={basePath} path={path ?? undefined}>
      {result}
    </RouterProvider>
  );
}

function usePathOptions(
  routes: string | readonly string[],
  { basePath, matchTrailingSlash = true }: PathParamOptions,
): [string | null, RouteMatcher[]] {
  const matchers = useMatchers(
    Array.isArray(routes) ? [...routes] : [routes as string],
  );
  return [trailingMatch(usePath(basePath), matchTrailingSlash), matchers];
}

function usePathParamsImpl(
  routes: string | readonly string[],
  options: PathParamOptions = {},
):
  | Record<string, string>
  | [string, Record<string, string>]
  | [null, null]
  | null {
  const isSingle = !Array.isArray(routes);
  const [path, matchers] = usePathOptions(routes, options);
  if (path === null) return isSingle ? null : NO_MATCH;
  const [matcher, params] = getMatchParams(path, matchers);
  if (!matcher) return isSingle ? null : NO_MATCH;
  return isSingle ? params : [matcher.path, params];
}

// raviger's overloads derive the params type from the route string.
export const usePathParams =
  usePathParamsImpl as unknown as typeof RavigerUsePathParams;

/** @public raviger API parity for plugins. */
export function useMatch(
  routes: string | string[],
  options: PathParamOptions = {},
): string | null {
  const [path, matchers] = usePathOptions(routes, options);
  const matcher = matchers.find(({ regex }) => path?.match(regex));
  return matcher?.path ?? null;
}

// ---------------------------------------------------------------------------
// Navigation (writes go through the TanStack router)
// ---------------------------------------------------------------------------

function isAbsolute(url: string) {
  return /^(?:[a-z]+:)?\/\//i.test(url);
}

function isCurrentOrigin(url: string) {
  return window.location.origin === new URL(url).origin;
}

export function navigate(url: string, options?: NavigateOptions): void {
  if (typeof url !== "string") {
    throw new Error('"url" must be a string, was provided a(n) ' + typeof url);
  }
  if (Array.isArray(options?.query)) {
    throw new Error('"query" a serializable object or URLSearchParams');
  }
  if (options?.query) {
    url += "?" + new URLSearchParams(options.query).toString();
  }
  if (isAbsolute(url) && !isCurrentOrigin(url)) {
    window.location.assign(url);
    return;
  }
  if (isAbsolute(url) || !url.startsWith("/")) {
    // `history.pushState` resolved relative URLs (`questionnaire/123`,
    // `?page=2`) against the current document URL. Do the same before the
    // router, which would resolve them against the origin.
    const base = window.location.origin + currentHistoryLocation().href;
    const parsed = new URL(url, base);
    url = parsed.pathname + parsed.search + parsed.hash;
  }
  const state =
    options?.state && typeof options.state === "object"
      ? (options.state as Record<string, unknown>)
      : undefined;
  const router = getRouter();
  // Some pages call `navigate()` during render. raviger changed the URL at
  // once; the router renders the new page only when it commits, so each
  // render would start the same navigation again and the load would never
  // finish. Skip a navigation to the URL the router is already moving to.
  const parsed = new URL(url, window.location.origin);
  const target =
    parsed.pathname +
    router.options.stringifySearch(router.options.parseSearch(parsed.search)) +
    parsed.hash;
  const rendered = router.state.resolvedLocation ?? router.state.location;
  if (target === router.latestLocation.href && target !== rendered.href) {
    return;
  }
  void router.navigate({
    href: url,
    replace: !!options?.replace,
    state,
  });
  // raviger changed `window.location` before `navigate()` returned, and some
  // code reads it right after a write. The browser history queues the write
  // to a microtask; flush it now.
  router.history.flush();
}

export function useNavigate(optBasePath = "") {
  const contextBasePath = useBasePath();
  return useCallback(
    (url: string, options?: NavigateOptions) => {
      const basePath = optBasePath || contextBasePath;
      navigate(url.startsWith("/") ? basePath + url : url, options);
    },
    [contextBasePath, optBasePath],
  );
}

const DEFAULT_PROMPT = "Are you sure you want to leave this page?";

/**
 * @public raviger API parity for plugins. Core code uses
 * `useNavigationBlocker` (`src/hooks/useNavigationBlocker.ts`).
 */
export function useNavigationPrompt(predicate = true, prompt = DEFAULT_PROMPT) {
  useNavigationBlocker(predicate, prompt);
}

// ---------------------------------------------------------------------------
// Query string (port of raviger `querystring.ts`)
// ---------------------------------------------------------------------------

function parseQuery<T extends QueryParam>(query: string): T {
  return Object.fromEntries(new URLSearchParams(query).entries()) as T;
}

function serializeQuery<T extends QueryParam>(query: Partial<T>): string {
  return new URLSearchParams(
    Object.entries(query).filter(([, value]) => value !== null),
  ).toString();
}

export function useQueryParams<T extends QueryParam>(
  parseFn: (query: string) => T = parseQuery,
  serializeFn: (query: Partial<T>) => string = serializeQuery,
): [T, (query: T, options?: setQueryParamsOptions) => void] {
  const { searchStr } = useRouterLocation();

  const setQuery = useCallback(
    (
      query: T,
      { overwrite = true, replace = false }: setQueryParamsOptions = {},
    ) => {
      const location = currentHistoryLocation();
      let href = location.pathname;
      const next = overwrite
        ? query
        : { ...parseFn(location.search), ...query };
      const serialized = serializeFn(next).toString();
      if (serialized) href += "?" + serialized;
      if (!overwrite) href += location.hash;
      navigate(href, { replace });
    },
    [parseFn, serializeFn],
  );

  return [parseFn(searchStr), setQuery];
}

// ---------------------------------------------------------------------------
// Redirect (port of raviger `redirect.ts`)
// ---------------------------------------------------------------------------

export function useRedirect(
  predicateUrl: string | null,
  targetUrl: string,
  { query, replace = true, merge = true, state }: UseRedirectOptions = {},
) {
  const path = usePath();
  const [currentQuery] = useQueryParams();
  const hash = useHash({ stripHash: false });

  let href = targetUrl;
  const serialized = new URLSearchParams({
    ...(merge ? currentQuery : {}),
    ...(query instanceof URLSearchParams
      ? Object.fromEntries(query.entries())
      : query),
  }).toString();
  if (serialized) href += "?" + serialized;
  if (merge && hash) href += hash;

  useLayoutEffect(() => {
    if (path === predicateUrl) navigate(href, { replace, state });
  }, [predicateUrl, href, replace, path, state]);
}

export function Redirect({
  to,
  query,
  replace = true,
  merge = true,
  state,
}: RedirectProps) {
  useRedirect(usePath(), to, { query, replace, merge, state });
  return null;
}

// ---------------------------------------------------------------------------
// Link (port of raviger `Link.tsx`)
// ---------------------------------------------------------------------------

function useLinkBasePath(basePath?: string) {
  const contextBasePath = useBasePath();
  return basePath === "/" ? "" : basePath || contextBasePath;
}

function getLinkHref(href: string, basePath = "") {
  return href.startsWith("/") ? basePath + href : href;
}

function shouldTrap(
  event: React.MouseEvent<HTMLAnchorElement>,
  target?: string,
) {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !(target && target !== "_self") &&
    !(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
  );
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, basePath, replace, query, state, ...props },
  ref,
) {
  const linkBasePath = useLinkBasePath(basePath);
  const resolvedHref = getLinkHref(href, linkBasePath);
  const { onClick, target } = props;

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      try {
        onClick?.(event);
      } catch (error) {
        event.preventDefault();
        throw error;
      }
      if (shouldTrap(event, target)) {
        event.preventDefault();
        navigate(event.currentTarget.href, { replace, query, state });
      }
    },
    [onClick, target, replace, query, state],
  );

  return <a {...props} href={resolvedHref} onClick={handleClick} ref={ref} />;
});

function absolutePathName(path: string) {
  return path.startsWith("/") ? path : new URL(path, document.baseURI).pathname;
}

/** @public raviger API parity for plugins. */
export const ActiveLink = forwardRef<HTMLAnchorElement, ActiveLinkProps>(
  function ActiveLink(
    { basePath, className, exactActiveClass, activeClass, ...props },
    ref,
  ) {
    const linkBasePath = useLinkBasePath(basePath);
    const fullPath = useFullPath();
    const href = absolutePathName(getLinkHref(props.href, linkBasePath));
    if (exactActiveClass && fullPath === href) {
      className = `${className ?? ""} ${exactActiveClass}`.trim();
    }
    if (activeClass && fullPath.startsWith(href)) {
      className = `${className ?? ""} ${activeClass}`.trim();
    }
    return (
      <Link
        {...props}
        basePath={linkBasePath}
        className={className}
        ref={ref}
      />
    );
  },
);

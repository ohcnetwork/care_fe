import {
  type AnyRoute,
  createRoute,
  useParams,
  useRouter,
} from "@tanstack/react-router";
import { useLayoutEffect, useMemo } from "react";

import { getOrganizationTabRoutes, useCareApps } from "@/hooks/useCareApps";

import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";

import { foldLayoutFlags } from "@/lib/router/layoutFlags";
import type { RouteStaticData } from "@/lib/router/staticData";

/** Parent for plugin routes: the signed-in layout (`src/routes/_app.tsx`). */
const PLUGIN_PARENT_ROUTE_ID = "/_app";

type PluginRouteRender = (params: Record<string, string>) => React.ReactNode;

export interface PluginRouteDefinition {
  plugin: string;
  path: string;
  render: PluginRouteRender;
}

/** Converts a manifest path pattern (`/a/:id`, `/a*`) to a TanStack path. */
export function toRouterPath(pattern: string): string {
  let path = pattern.replace(/:([a-zA-Z_]+)/g, "$$$1");
  if (path.endsWith("*")) {
    path = path.replace(/\*$/, "").replace(/\/$/, "") + "/$";
  }
  return path;
}

function routeFullPath(path: string) {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function pathSegments(fullPath: string) {
  return fullPath.split("/").filter(Boolean);
}

function hasChildren(route: AnyRoute) {
  const children = route.children as AnyRoute[] | Record<string, AnyRoute>;
  return !!children && Object.keys(children).length > 0;
}

/**
 * Layout flags for a plugin route: those of the deepest core layout route
 * (a route with children) whose path is a prefix of the plugin path. For
 * example, `/facility/$facilityId/settings/encounter` gets the settings
 * workspace from the settings layout. A route param matches any segment.
 */
function inheritedLayout(
  routes: readonly AnyRoute[],
  fullPath: string,
): RouteStaticData {
  const segments = pathSegments(fullPath);
  let layout: AnyRoute | undefined;
  let depth = -1;
  for (const route of routes) {
    if (!hasChildren(route)) continue;
    const prefix = pathSegments(route.fullPath);
    if (prefix.length >= segments.length || prefix.length <= depth) continue;
    const matches = prefix.every((segment, index) =>
      segment.startsWith("$") ? segment !== "$" : segment === segments[index],
    );
    if (matches) {
      layout = route;
      depth = prefix.length;
    }
  }

  const branch: RouteStaticData[] = [];
  for (let route = layout; route; route = route.parentRoute) {
    branch.unshift(route.options?.staticData ?? {});
  }
  const { sidebar, workspace, navigation } = foldLayoutFlags(branch);
  return { sidebar, workspace, navigation };
}

/** Children the parent had before any plugin route was attached. */
const baseChildren = new WeakMap<AnyRoute, AnyRoute[]>();
const attachedPluginRoutes = new WeakMap<AnyRoute, Set<AnyRoute>>();
let hasAttached = false;

function PluginRouteComponent({
  plugin,
  render,
}: Pick<PluginRouteDefinition, "plugin" | "render">) {
  const params = useParams({ strict: false }) as Record<string, string>;
  return (
    <PluginErrorBoundary pluginName={plugin}>
      {render(params)}
    </PluginErrorBoundary>
  );
}

/**
 * Attaches plugin routes to the live route tree, then re-processes the tree
 * so the current location is matched again. Core routes keep precedence: a
 * plugin path that already exists in the tree is skipped.
 *
 * `router.update({ routeTree })` only rebuilds when the tree object changes,
 * and `addChildren` returns the same root, so this calls
 * `buildRouteTree` + `setRoutes` directly (both public on the router).
 */
export function attachPluginRoutes(
  router: ReturnType<typeof useRouter>,
  definitions: PluginRouteDefinition[],
) {
  const parent = router.routesById[PLUGIN_PARENT_ROUTE_ID] as
    AnyRoute | undefined;
  if (!parent) {
    console.error(`Plugin route parent "${PLUGIN_PARENT_ROUTE_ID}" not found`);
    return;
  }

  if (!baseChildren.has(parent)) {
    baseChildren.set(parent, [...((parent.children as AnyRoute[]) ?? [])]);
  }
  const previous = attachedPluginRoutes.get(parent) ?? new Set();
  const corePaths = new Set(
    Object.keys(router.routesByPath).filter((fullPath) => {
      const route = router.routesByPath[fullPath] as AnyRoute;
      return !previous.has(route);
    }),
  );
  const coreRoutes = (Object.values(router.routesById) as AnyRoute[]).filter(
    (route) => !previous.has(route),
  );

  const pluginRoutes: AnyRoute[] = [];
  const seen = new Set<string>();
  for (const { plugin, path, render } of definitions) {
    const routerPath = toRouterPath(path);
    const fullPath = routeFullPath(routerPath);
    if (corePaths.has(fullPath)) {
      console.warn(
        `Plugin "${plugin}" route "${path}" is shadowed by a core route`,
      );
      continue;
    }
    if (seen.has(fullPath)) continue;
    seen.add(fullPath);

    pluginRoutes.push(
      createRoute({
        getParentRoute: () => parent,
        path: routerPath,
        staticData: inheritedLayout(coreRoutes, fullPath),
        component: () => (
          <PluginRouteComponent plugin={plugin} render={render} />
        ),
      }),
    );
  }

  parent.addChildren([...(baseChildren.get(parent) ?? []), ...pluginRoutes]);
  attachedPluginRoutes.set(parent, new Set(pluginRoutes));
  hasAttached = true;
  router.setRoutes(router.buildRouteTree());
  void router.invalidate();
}

/**
 * Mount once inside the router. Each time the set of loaded plugin manifests
 * changes, their `routes` and `organizationTabs` pages are attached to the
 * TanStack tree. Until then, the `_app/$` splat shows a spinner for an
 * unknown path.
 */
export function PluginRouteAttacher() {
  const careApps = useCareApps();
  const router = useRouter();

  const definitions = useMemo(
    () =>
      careApps.flatMap((app) =>
        app.isLoading
          ? []
          : Object.entries({
              ...app.routes,
              ...getOrganizationTabRoutes(app),
            }).map(([path, render]) => ({
              plugin: app.slug,
              path,
              render: render as PluginRouteRender,
            })),
      ),
    [careApps],
  );

  useLayoutEffect(() => {
    if (definitions.length === 0 && !hasAttached) return;
    attachPluginRoutes(router, definitions);
  }, [router, definitions]);

  return null;
}

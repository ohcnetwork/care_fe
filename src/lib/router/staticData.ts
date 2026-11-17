import type { ReactNode } from "react";

/** Which inner workspace chrome (header + inner sidebar) a route lives in. */
export type Workspace = "location" | "settings" | "service";

export interface CrumbMatch {
  params: Record<string, string>;
  loaderData: unknown;
  pathname: string;
}

/**
 * A breadcrumb for a matched route. A string is an i18n key. A function gets
 * the match and returns the label; return a component when the label needs
 * data (for example, a device name).
 */
export type Crumb = string | ((match: CrumbMatch) => ReactNode);

/**
 * Route-level layout flags. The deepest matched route that sets a flag wins.
 * A flag on a parent covers all of its children. These replace the URL
 * regexes in the legacy `AppRouter`.
 */
export interface RouteStaticData {
  /** Hide the app sidebar when `false`. Defaults to `true`. */
  sidebar?: boolean;
  workspace?: Workspace;
  crumb?: Crumb;
  /**
   * The route was attached from a plugin manifest at runtime. The shell
   * derives its layout from the URL, as it does for legacy routes.
   */
  pluginRoute?: boolean;
}

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption extends RouteStaticData {}
}

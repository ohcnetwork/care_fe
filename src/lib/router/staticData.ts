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
  /**
   * `false` shows the page without navigation chrome. Staff pages keep the
   * page frame and lose the sidebar and header; patient pages lose all
   * chrome. Defaults to `true`.
   */
  sidebar?: boolean;
  workspace?: Workspace;
  crumb?: Crumb;
  /**
   * The staff shell derives `sidebar` and `workspace` from the URL regexes
   * of the legacy route tables. Set on plugin routes and on shared routes
   * that render the legacy tables.
   */
  legacyLayout?: boolean;
}

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption extends RouteStaticData {}
}

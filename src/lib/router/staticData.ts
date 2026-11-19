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

/** Which app sidebar the staff shell shows. */
export type SidebarNavigation = "facility" | "admin";

/**
 * Route-level layout flags. The deepest matched route that sets a flag wins.
 * A flag on a parent covers all of its children. Read them with
 * `useLayoutFlags()` (`src/lib/router/layoutFlags.ts`).
 */
export interface RouteStaticData {
  /**
   * Staff shell: `false` keeps the page frame and removes the sidebar and
   * header. Defaults to `true`.
   */
  sidebar?: boolean;
  /** Staff shell: the inner workspace (header and inner sidebar). */
  workspace?: Workspace;
  /** Staff shell: the app sidebar to show. Defaults to `"facility"`. */
  navigation?: SidebarNavigation;
  /**
   * Patient shell: `false` removes all chrome (the appointment booking
   * flow). Defaults to `true`.
   */
  patientChrome?: boolean;
  crumb?: Crumb;
}

/**
 * A full-screen staff page: no sidebar and no header. The page gives the
 * width to its content and carries its own way back.
 */
export const fullScreenPage = { sidebar: false } satisfies RouteStaticData;

/**
 * Questionnaire fill pages (the full-screen fill experience). They sit in
 * separate branches (facility patient, encounter, location and patient), so
 * they share this constant.
 */
export const questionnaireFillPage = fullScreenPage;

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption extends RouteStaticData {}
}

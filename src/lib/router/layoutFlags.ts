import {
  type AnyRouteMatch,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";

import { isShowingPreviousPage } from "@/lib/router/previousPage";

import type {
  RouteStaticData,
  SidebarNavigation,
  Workspace,
} from "@/lib/router/staticData";

export interface LayoutFlags {
  sidebar: boolean;
  /** Unset when the sidebar is hidden. */
  workspace?: Workspace;
  navigation: SidebarNavigation;
  patientChrome: boolean;
}

type LayoutStaticData = Pick<
  RouteStaticData,
  "sidebar" | "workspace" | "navigation" | "patientChrome"
>;

/**
 * Folds layout flags over a route branch, root first. The deepest route that
 * sets a flag wins.
 */
export function foldLayoutFlags(
  branch: readonly LayoutStaticData[],
): LayoutFlags {
  const flags = branch.reduce<LayoutFlags>(
    (acc, data) => ({
      sidebar: data.sidebar ?? acc.sidebar,
      workspace: data.workspace ?? acc.workspace,
      navigation: data.navigation ?? acc.navigation,
      patientChrome: data.patientChrome ?? acc.patientChrome,
    }),
    { sidebar: true, navigation: "facility", patientChrome: true },
  );
  return { ...flags, workspace: flags.sidebar ? flags.workspace : undefined };
}

function selectLayoutFlags(allMatches: AnyRouteMatch[]): LayoutFlags {
  // A route that failed (for example, a not-found from a guard) does not set
  // the layout of the error page.
  const failedIndex = allMatches.findIndex(
    (m) => m.status === "notFound" || m.status === "error",
  );
  const matches =
    failedIndex === -1 ? allMatches : allMatches.slice(0, failedIndex);
  return foldLayoutFlags(matches.map((m) => m.staticData));
}

function trimTrailingSlash(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * Layout flags of the page on screen. While the router moves to a new path
 * in the same route (for example another `$tab`), the page shows the new
 * location at once (see `useCurrentLocation`), so its flags come from the
 * routes of the new location. While the previous page stays on screen, and
 * after the change commits, they come from the committed matches.
 */
export function useLayoutFlags(): LayoutFlags {
  const router = useRouter();
  return useRouterState({
    select: (state) => {
      const committedPath = state.matches.at(-1)?.pathname;
      if (
        committedPath === undefined ||
        trimTrailingSlash(committedPath) ===
          trimTrailingSlash(state.location.pathname) ||
        isShowingPreviousPage(router, state)
      ) {
        return selectLayoutFlags(state.matches);
      }
      const [routes] = router.getMatchedRoutes(state.location.pathname);
      return foldLayoutFlags(
        routes.map((route) => route.options.staticData ?? {}),
      );
    },
  });
}

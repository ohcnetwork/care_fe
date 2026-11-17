import {
  createRootRouteWithContext,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import Loading from "@/components/Common/Loading";

import { PluginRouteAttacher } from "@/lib/router/pluginRoutes";
import type { RouterContext } from "@/router";
import { AreaChrome, useResolvedArea } from "@/Routers/AreaChrome";

const RouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-router-devtools").then((module) => ({
        default: module.TanStackRouterDevtools,
      })),
    )
  : () => null;

function trimTrailingSlash(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * While the router loads a new path, the page the user leaves stays on
 * screen. raviger removed it at once. Make it inert (no clicks, out of the
 * accessibility tree) until the new page commits, so a click cannot land on
 * the old page and cancel the navigation. Query-only changes (for example,
 * typing in a search filter) are not affected.
 */
function LeavingPageGuard({ children }: { children: React.ReactNode }) {
  const leaving = useRouterState({
    select: (state) =>
      state.status === "pending" &&
      trimTrailingSlash(state.location.pathname) !==
        trimTrailingSlash((state.resolvedLocation ?? state.location).pathname),
  });
  return (
    <div className="contents" inert={leaving}>
      {children}
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

/**
 * Pathless layouts guard the areas (`_public`, `_patient`, `_app`); shared
 * URLs resolve their area in `beforeLoad`. This component selects the
 * chrome of the resolved area, so it stays mounted while the area is the
 * same, and shows the loading screen until the session is known.
 */
function RootComponent() {
  const area = useResolvedArea();

  return (
    <>
      {area ? (
        <AreaChrome area={area}>
          <LeavingPageGuard>
            <Outlet />
          </LeavingPageGuard>
        </AreaChrome>
      ) : (
        <Loading />
      )}
      <PluginRouteAttacher />
      <Suspense>
        <RouterDevtools position="bottom-right" />
      </Suspense>
    </>
  );
}

import {
  createRootRouteWithContext,
  Outlet,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import Loading from "@/components/Common/Loading";

import { PluginRouteAttacher } from "@/lib/router/pluginRoutes";
import { isShowingPreviousPage } from "@/lib/router/previousPage";
import type { RouterContext } from "@/router";
import { AreaChrome, useResolvedArea } from "@/Routers/AreaChrome";

const RouterDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-router-devtools").then((module) => ({
        default: module.TanStackRouterDevtools,
      })),
    )
  : () => null;

/**
 * While the router loads a page for a different route, the previous page
 * stays on screen. raviger removed it at once. Make it inert (no clicks, out
 * of the accessibility tree) until the new page commits, so a click cannot
 * land on it and cancel the navigation. Changes within the same route (for
 * example a query change) are not affected.
 */
function PreviousPageGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const showingPrevious = useRouterState({
    select: (state) =>
      state.status === "pending" && isShowingPreviousPage(router, state),
  });
  return (
    <div className="contents" inert={showingPrevious}>
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
          <PreviousPageGuard>
            <Outlet />
          </PreviousPageGuard>
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

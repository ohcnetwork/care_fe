import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
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
          <Outlet />
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

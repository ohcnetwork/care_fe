import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import Loading from "@/components/Common/Loading";

import { PluginRouteAttacher } from "@/lib/router/pluginRoutes";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import type { RouterContext } from "@/router";
import PublicRouter from "@/Routers/PublicRouter";

const PatientRouter = lazy(() => import("@/Routers/PatientRouter"));

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
 * Phase 1: the auth gate stays in React. Signed-out users get the legacy
 * public router for every path; OTP users get the legacy patient router;
 * signed-in users get the TanStack route tree (whose `$` splat still renders
 * the legacy app routes). Phase 2 moves the gate into `beforeLoad`.
 */
function RootComponent() {
  return (
    <>
      <AuthUserProvider
        unauthorized={<PublicRouter />}
        otpAuthorized={
          <Suspense fallback={<Loading />}>
            <PatientRouter />
          </Suspense>
        }
      >
        <PluginRouteAttacher />
        <Outlet />
      </AuthUserProvider>
      <Suspense>
        <RouterDevtools position="bottom-right" />
      </Suspense>
    </>
  );
}

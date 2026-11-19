import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { RouterProvider as RavigerBasePathProvider } from "raviger";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

export const Route = createFileRoute("/_app/facility/$facilityId/settings")({
  component: RouteComponent,
  notFoundComponent: () => <ErrorPage />,
  staticData: { workspace: "settings", crumb: "settings" },
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  const { pathname } = useLocation();
  const basePath = `/facility/${facilityId}/settings`;
  // Settings pages (and plugin components inside them) still write links and
  // `navigate()` calls relative to this base, as raviger's nested `useRoutes`
  // did. Keep that context until Phase 4 rewrites them to absolute routes.
  const relativePath =
    pathname.replace(new RegExp(`^${basePath}`, "i"), "") || "/";

  return (
    <RavigerBasePathProvider basePath={basePath} path={relativePath}>
      <div className="min-w-0">
        <Outlet />
      </div>
    </RavigerBasePathProvider>
  );
}

import { createFileRoute, Outlet } from "@tanstack/react-router";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

export const Route = createFileRoute("/_app/facility/$facilityId/settings")({
  component: RouteComponent,
  notFoundComponent: () => <ErrorPage />,
  staticData: { workspace: "settings", crumb: "settings" },
});

function RouteComponent() {
  return (
    <div className="min-w-0">
      <Outlet />
    </div>
  );
}

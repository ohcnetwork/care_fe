import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { RouterProvider as RavigerBasePathProvider } from "raviger";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId",
)({
  component: RouteComponent,
  staticData: { workspace: "location" },
});

function RouteComponent() {
  const { facilityId, locationId } = Route.useParams();
  const { pathname } = useLocation();
  const basePath = `/facility/${facilityId}/locations/${locationId}`;
  // Location pages still write links and `navigate()` calls relative to this
  // base, as raviger's nested `useRoutes` did. Keep that context until the
  // links use absolute routes.
  const relativePath =
    pathname.replace(new RegExp(`^${basePath}`, "i"), "") || "/";

  return (
    <RavigerBasePathProvider basePath={basePath} path={relativePath}>
      <div>
        <Outlet />
      </div>
    </RavigerBasePathProvider>
  );
}

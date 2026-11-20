import {
  createFileRoute,
  Outlet,
  useLocation,
  useParams,
} from "@tanstack/react-router";
import { RouterProvider as RavigerBasePathProvider } from "raviger";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId",
)({
  component: RouteComponent,
  staticData: { workspace: "service" },
});

function RouteComponent() {
  const { facilityId, serviceId } = useParams({
    from: "/_app/facility/$facilityId/services/$serviceId",
  });
  const { pathname } = useLocation();
  const basePath = `/facility/${facilityId}/services/${serviceId}`;
  // Service pages still write links and `navigate()` calls relative to this
  // base, as raviger's nested `useRoutes` did. Keep that context until a
  // later phase rewrites them to absolute routes.
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

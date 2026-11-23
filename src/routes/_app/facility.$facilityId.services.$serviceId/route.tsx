import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId",
)({
  component: RouteComponent,
  staticData: { workspace: "service" },
});

function RouteComponent() {
  return (
    <div>
      <Outlet />
    </div>
  );
}

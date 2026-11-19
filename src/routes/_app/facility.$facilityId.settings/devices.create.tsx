import { createFileRoute } from "@tanstack/react-router";

import CreateDevice from "@/pages/Facility/settings/devices/CreateDevice";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/devices/create",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <CreateDevice facilityId={facilityId} />;
}

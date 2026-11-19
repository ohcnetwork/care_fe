import { createFileRoute } from "@tanstack/react-router";

import DevicesList from "@/pages/Facility/settings/devices/DevicesList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/devices/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <DevicesList facilityId={facilityId} />;
}

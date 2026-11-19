import { createFileRoute, useParams } from "@tanstack/react-router";

import DevicesList from "@/pages/Facility/settings/devices/DevicesList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/devices/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/devices/",
  });
  return <DevicesList facilityId={facilityId} />;
}

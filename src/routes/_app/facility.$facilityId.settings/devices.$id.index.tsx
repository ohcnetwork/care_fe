import { createFileRoute, useParams } from "@tanstack/react-router";

import { deviceShowSearch } from "@/lib/router/search/settings";
import DeviceDetail from "@/pages/Facility/settings/devices/DeviceShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/devices/$id/",
)({
  validateSearch: deviceShowSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/devices/$id/",
  });
  return <DeviceDetail facilityId={facilityId} deviceId={id} />;
}

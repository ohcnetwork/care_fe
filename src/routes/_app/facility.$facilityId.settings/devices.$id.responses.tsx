import { createFileRoute, useParams } from "@tanstack/react-router";

import DeviceDetail from "@/pages/Facility/settings/devices/DeviceShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/devices/$id/responses",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/devices/$id/responses",
  });
  return <DeviceDetail facilityId={facilityId} deviceId={id} tab="responses" />;
}

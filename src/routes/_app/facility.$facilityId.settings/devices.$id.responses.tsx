import { createFileRoute } from "@tanstack/react-router";

import DeviceDetail from "@/pages/Facility/settings/devices/DeviceShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/devices/$id/responses",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return <DeviceDetail facilityId={facilityId} deviceId={id} tab="responses" />;
}

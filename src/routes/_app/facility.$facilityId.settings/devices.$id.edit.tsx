import { createFileRoute } from "@tanstack/react-router";

import UpdateDevice from "@/pages/Facility/settings/devices/UpdateDevice";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/devices/$id/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return <UpdateDevice facilityId={facilityId} deviceId={id} />;
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import { deviceFormSearch } from "@/lib/router/search/settings";
import UpdateDevice from "@/pages/Facility/settings/devices/UpdateDevice";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/devices/$id/edit",
)({
  validateSearch: deviceFormSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/devices/$id/edit",
  });
  return <UpdateDevice facilityId={facilityId} deviceId={id} />;
}

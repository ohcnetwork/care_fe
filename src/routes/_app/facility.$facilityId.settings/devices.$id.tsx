import { createFileRoute } from "@tanstack/react-router";

import { DeviceCrumb } from "@/pages/Facility/settings/devices/DeviceCrumb";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/devices/$id",
)({
  staticData: {
    crumb: ({ params }) => (
      <DeviceCrumb facilityId={params.facilityId} deviceId={params.id} />
    ),
  },
});

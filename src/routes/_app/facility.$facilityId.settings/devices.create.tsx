import { createFileRoute, useParams } from "@tanstack/react-router";

import CreateDevice from "@/pages/Facility/settings/devices/CreateDevice";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/devices/create",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/devices/create",
  });
  return <CreateDevice facilityId={facilityId} />;
}

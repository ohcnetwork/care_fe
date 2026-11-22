import { createFileRoute, useParams } from "@tanstack/react-router";

import { FacilityResponses } from "@/pages/Facility/settings/FacilityResponses";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/responses",
)({
  component: RouteComponent,
  staticData: { crumb: "responses" },
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/responses",
  });
  return <FacilityResponses facilityId={facilityId} />;
}

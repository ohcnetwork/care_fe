import { createFileRoute } from "@tanstack/react-router";

import { FacilityResponses } from "@/pages/Facility/settings/FacilityResponses";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/responses",
)({
  component: RouteComponent,
  staticData: { crumb: "responses" },
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <FacilityResponses facilityId={facilityId} />;
}

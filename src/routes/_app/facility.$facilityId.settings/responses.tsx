import { createFileRoute, useParams } from "@tanstack/react-router";

import { resourceResponseListSearch } from "@/lib/router/search/questionnaire";
import { FacilityResponses } from "@/pages/Facility/settings/FacilityResponses";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/responses",
)({
  validateSearch: resourceResponseListSearch,
  component: RouteComponent,
  staticData: { crumb: "responses" },
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/responses",
  });
  return <FacilityResponses facilityId={facilityId} />;
}

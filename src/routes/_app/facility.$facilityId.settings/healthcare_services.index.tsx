import { createFileRoute, useParams } from "@tanstack/react-router";

import { healthcareServiceListSearch } from "@/lib/router/search/settings";
import HealthcareServiceList from "@/pages/Facility/settings/healthcareService/HealthcareServiceList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/healthcare_services/",
)({
  validateSearch: healthcareServiceListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/healthcare_services/",
  });
  return <HealthcareServiceList facilityId={facilityId} />;
}

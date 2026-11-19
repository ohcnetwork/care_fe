import { createFileRoute, useParams } from "@tanstack/react-router";

import HealthcareServiceList from "@/pages/Facility/settings/healthcareService/HealthcareServiceList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/healthcare_services/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/healthcare_services/",
  });
  return <HealthcareServiceList facilityId={facilityId} />;
}

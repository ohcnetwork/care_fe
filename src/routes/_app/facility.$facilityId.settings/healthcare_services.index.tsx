import { createFileRoute } from "@tanstack/react-router";

import HealthcareServiceList from "@/pages/Facility/settings/healthcareService/HealthcareServiceList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/healthcare_services/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <HealthcareServiceList facilityId={facilityId} />;
}

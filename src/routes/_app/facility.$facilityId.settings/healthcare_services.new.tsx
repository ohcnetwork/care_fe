import { createFileRoute, useParams } from "@tanstack/react-router";

import HealthcareServiceForm from "@/pages/Facility/settings/healthcareService/HealthcareServiceForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/healthcare_services/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/healthcare_services/new",
  });
  return <HealthcareServiceForm facilityId={facilityId} />;
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import HealthcareServiceShow from "@/pages/Facility/settings/healthcareService/HealthcareServiceShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/healthcare_services/$id/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/healthcare_services/$id/",
  });
  return (
    <HealthcareServiceShow facilityId={facilityId} healthcareServiceId={id} />
  );
}

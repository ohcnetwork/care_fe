import { createFileRoute } from "@tanstack/react-router";

import HealthcareServiceForm from "@/pages/Facility/settings/healthcareService/HealthcareServiceForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/healthcare_services/$id/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return (
    <HealthcareServiceForm facilityId={facilityId} healthcareServiceId={id} />
  );
}

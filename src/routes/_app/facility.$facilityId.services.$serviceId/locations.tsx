import { createFileRoute } from "@tanstack/react-router";

import HealthcareServiceShow from "@/pages/Facility/services/HealthcareServiceShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/locations",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, serviceId } = Route.useParams();
  return (
    <HealthcareServiceShow facilityId={facilityId} serviceId={serviceId} />
  );
}

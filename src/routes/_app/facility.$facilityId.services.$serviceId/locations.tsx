import { createFileRoute, useParams } from "@tanstack/react-router";

import HealthcareServiceShow from "@/pages/Facility/services/HealthcareServiceShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/locations",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, serviceId } = useParams({
    from: "/_app/facility/$facilityId/services/$serviceId/locations",
  });
  return (
    <HealthcareServiceShow facilityId={facilityId} serviceId={serviceId} />
  );
}

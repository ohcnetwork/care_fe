import { createFileRoute } from "@tanstack/react-router";

import PrintAppointments from "@/pages/Appointments/components/PrintAppointments";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/appointments/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, serviceId } = Route.useParams();
  return (
    <PrintAppointments
      facilityId={facilityId}
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
    />
  );
}

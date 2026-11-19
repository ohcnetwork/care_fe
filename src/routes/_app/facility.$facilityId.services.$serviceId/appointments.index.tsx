import { createFileRoute } from "@tanstack/react-router";

import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/appointments/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { serviceId } = Route.useParams();
  return (
    <AppointmentsPage
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
    />
  );
}

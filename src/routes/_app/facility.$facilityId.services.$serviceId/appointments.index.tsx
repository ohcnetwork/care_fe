import { createFileRoute, useParams } from "@tanstack/react-router";

import { appointmentListSearch } from "@/lib/router/search/appointments";
import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/appointments/",
)({
  validateSearch: appointmentListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { serviceId } = useParams({
    from: "/_app/facility/$facilityId/services/$serviceId/appointments/",
  });
  return (
    <AppointmentsPage
      resourceType={SchedulableResourceType.HealthcareService}
      resourceId={serviceId}
    />
  );
}

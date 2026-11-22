import { createFileRoute } from "@tanstack/react-router";

import { appointmentListSearch } from "@/lib/router/search/appointments";
import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/appointments/",
)({
  validateSearch: appointmentListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppointmentsPage resourceType={SchedulableResourceType.Practitioner} />
  );
}

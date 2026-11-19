import { createFileRoute } from "@tanstack/react-router";

import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/appointments/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AppointmentsPage resourceType={SchedulableResourceType.Practitioner} />
  );
}

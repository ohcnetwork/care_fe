import { createFileRoute, useParams } from "@tanstack/react-router";

import { appointmentShowSearch } from "@/lib/router/search/appointments";
import AppointmentDetail from "@/pages/Appointments/AppointmentDetail";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/appointments/$appointmentId",
)({
  validateSearch: appointmentShowSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { appointmentId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/appointments/$appointmentId",
  });
  return <AppointmentDetail appointmentId={appointmentId} />;
}

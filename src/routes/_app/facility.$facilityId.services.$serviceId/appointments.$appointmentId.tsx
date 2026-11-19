import { createFileRoute } from "@tanstack/react-router";

import AppointmentDetail from "@/pages/Appointments/AppointmentDetail";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/services/$serviceId/appointments/$appointmentId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { appointmentId } = Route.useParams();
  return <AppointmentDetail appointmentId={appointmentId} />;
}

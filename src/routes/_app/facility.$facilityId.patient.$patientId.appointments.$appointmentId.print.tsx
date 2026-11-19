import { createFileRoute } from "@tanstack/react-router";

import AppointmentPrint from "@/pages/Appointments/AppointmentPrint";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/appointments/$appointmentId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { appointmentId } = Route.useParams();
  return <AppointmentPrint appointmentId={appointmentId} />;
}

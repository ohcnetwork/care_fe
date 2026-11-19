import { createFileRoute, useParams } from "@tanstack/react-router";

import AppointmentPrint from "@/pages/Appointments/AppointmentPrint";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/appointments/$appointmentId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { appointmentId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/appointments/$appointmentId/print",
  });
  return <AppointmentPrint appointmentId={appointmentId} />;
}

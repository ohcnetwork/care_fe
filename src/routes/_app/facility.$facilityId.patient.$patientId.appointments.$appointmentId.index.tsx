import { createFileRoute, useParams } from "@tanstack/react-router";

import AppointmentDetail from "@/pages/Appointments/AppointmentDetail";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/appointments/$appointmentId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { appointmentId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/appointments/$appointmentId/",
  });
  return <AppointmentDetail appointmentId={appointmentId} />;
}

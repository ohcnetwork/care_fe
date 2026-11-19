import { createFileRoute, useParams } from "@tanstack/react-router";

import { AppointmentSuccess } from "@/pages/PublicAppointments/Success";

export const Route = createFileRoute(
  "/_patient/facility/$facilityId/appointments/$appointmentId/success",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { appointmentId } = useParams({
    from: "/_patient/facility/$facilityId/appointments/$appointmentId/success",
  });
  return <AppointmentSuccess appointmentId={appointmentId} />;
}

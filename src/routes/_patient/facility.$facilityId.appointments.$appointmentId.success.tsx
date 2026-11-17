import { createFileRoute } from "@tanstack/react-router";

import { AppointmentSuccess } from "@/pages/PublicAppointments/Success";

export const Route = createFileRoute(
  "/_patient/facility/$facilityId/appointments/$appointmentId/success",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { appointmentId } = Route.useParams();
  return <AppointmentSuccess appointmentId={appointmentId} />;
}

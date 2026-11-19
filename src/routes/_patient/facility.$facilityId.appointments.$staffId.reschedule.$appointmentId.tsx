import { createFileRoute } from "@tanstack/react-router";

import { ScheduleAppointment } from "@/pages/PublicAppointments/Schedule";

export const Route = createFileRoute(
  "/_patient/facility/$facilityId/appointments/$staffId/reschedule/$appointmentId",
)({
  component: RouteComponent,
  staticData: { patientChrome: false },
});

function RouteComponent() {
  const { facilityId, staffId, appointmentId } = Route.useParams();
  return (
    <ScheduleAppointment
      facilityId={facilityId}
      staffId={staffId}
      appointmentId={appointmentId}
    />
  );
}

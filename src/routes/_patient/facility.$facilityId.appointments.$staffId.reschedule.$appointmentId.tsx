import { createFileRoute, useParams } from "@tanstack/react-router";

import { ScheduleAppointment } from "@/pages/PublicAppointments/Schedule";

export const Route = createFileRoute(
  "/_patient/facility/$facilityId/appointments/$staffId/reschedule/$appointmentId",
)({
  component: RouteComponent,
  staticData: { patientChrome: false },
});

function RouteComponent() {
  const { facilityId, staffId, appointmentId } = useParams({
    from: "/_patient/facility/$facilityId/appointments/$staffId/reschedule/$appointmentId",
  });
  return (
    <ScheduleAppointment
      facilityId={facilityId}
      staffId={staffId}
      appointmentId={appointmentId}
    />
  );
}

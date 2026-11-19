import { createFileRoute, useParams } from "@tanstack/react-router";

import { ScheduleAppointment } from "@/pages/PublicAppointments/Schedule";

export const Route = createFileRoute(
  "/_patient/facility/$facilityId/appointments/$staffId/book-appointment",
)({
  component: RouteComponent,
  staticData: { patientChrome: false },
});

function RouteComponent() {
  const { facilityId, staffId } = useParams({
    from: "/_patient/facility/$facilityId/appointments/$staffId/book-appointment",
  });
  return <ScheduleAppointment facilityId={facilityId} staffId={staffId} />;
}

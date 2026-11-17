import { createFileRoute } from "@tanstack/react-router";

import { ScheduleAppointment } from "@/pages/PublicAppointments/Schedule";

export const Route = createFileRoute(
  "/_patient/facility/$facilityId/appointments/$staffId/book-appointment",
)({
  component: RouteComponent,
  staticData: { sidebar: false },
});

function RouteComponent() {
  const { facilityId, staffId } = Route.useParams();
  return <ScheduleAppointment facilityId={facilityId} staffId={staffId} />;
}

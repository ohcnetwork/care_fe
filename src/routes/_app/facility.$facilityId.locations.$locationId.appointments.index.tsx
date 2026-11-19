import { createFileRoute } from "@tanstack/react-router";

import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/appointments/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { locationId } = Route.useParams();
  return (
    <AppointmentsPage
      resourceType={SchedulableResourceType.Location}
      resourceId={locationId}
    />
  );
}

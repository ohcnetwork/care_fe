import { createFileRoute, useParams } from "@tanstack/react-router";

import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/appointments/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/appointments/",
  });
  return (
    <AppointmentsPage
      resourceType={SchedulableResourceType.Location}
      resourceId={locationId}
    />
  );
}

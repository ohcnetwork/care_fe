import { createFileRoute, useParams } from "@tanstack/react-router";

import { appointmentListSearch } from "@/lib/router/search/appointments";
import AppointmentsPage from "@/pages/Appointments/AppointmentsPage";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/appointments/",
)({
  validateSearch: appointmentListSearch,
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

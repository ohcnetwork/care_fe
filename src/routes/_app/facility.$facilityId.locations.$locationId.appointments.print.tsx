import { createFileRoute, useParams } from "@tanstack/react-router";

import { appointmentListSearch } from "@/lib/router/search/appointments";
import PrintAppointments from "@/pages/Appointments/components/PrintAppointments";
import { SchedulableResourceType } from "@/types/scheduling/schedule";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/appointments/print",
)({
  validateSearch: appointmentListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/appointments/print",
  });
  return (
    <PrintAppointments
      facilityId={facilityId}
      resourceType={SchedulableResourceType.Location}
      resourceId={locationId}
    />
  );
}

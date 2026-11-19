import { createFileRoute } from "@tanstack/react-router";

import { PatientProfile } from "@/components/Patient/PatientProfile";

// Keep this an index route. A layout file here would wrap the appointment
// routes that the Schedule area adds under `appointments/`.
export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/appointments/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId } = Route.useParams();
  return (
    <PatientProfile
      facilityId={facilityId}
      id={patientId}
      page="appointments"
    />
  );
}

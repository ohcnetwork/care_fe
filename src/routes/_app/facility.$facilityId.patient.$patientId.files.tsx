import { createFileRoute } from "@tanstack/react-router";

import { PatientProfile } from "@/components/Patient/PatientProfile";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/files",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId } = Route.useParams();
  return <PatientProfile facilityId={facilityId} id={patientId} page="files" />;
}

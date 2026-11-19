import { createFileRoute } from "@tanstack/react-router";

import { PatientRegistration } from "@/components/Patient/PatientRegistration";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/update",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId } = Route.useParams();
  return <PatientRegistration patientId={patientId} />;
}

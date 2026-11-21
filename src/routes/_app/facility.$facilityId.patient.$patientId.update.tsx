import { createFileRoute, useParams } from "@tanstack/react-router";

import { PatientRegistration } from "@/components/Patient/PatientRegistration";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/update",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/update",
  });
  return <PatientRegistration patientId={patientId} />;
}

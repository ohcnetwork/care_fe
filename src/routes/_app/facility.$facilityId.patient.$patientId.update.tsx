import { createFileRoute, useParams } from "@tanstack/react-router";

import { PatientRegistration } from "@/components/Patient/PatientRegistration";
import { patientRegistrationSearch } from "@/lib/router/search/patient";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/update",
)({
  validateSearch: patientRegistrationSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/update",
  });
  return <PatientRegistration patientId={patientId} />;
}

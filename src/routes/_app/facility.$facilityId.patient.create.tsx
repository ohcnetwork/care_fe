import { createFileRoute } from "@tanstack/react-router";

import { PatientRegistration } from "@/components/Patient/PatientRegistration";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/create",
)({ component: PatientRegistrationPage });

function PatientRegistrationPage() {
  return <PatientRegistration />;
}

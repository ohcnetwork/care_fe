import { createFileRoute } from "@tanstack/react-router";

import { PatientRegistration } from "@/components/Patient/PatientRegistration";

import { patientRegistrationSearch } from "@/lib/router/search/patient";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/create",
)({
  validateSearch: patientRegistrationSearch,
  component: PatientRegistrationPage,
});

function PatientRegistrationPage() {
  return <PatientRegistration />;
}

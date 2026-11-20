import { createFileRoute } from "@tanstack/react-router";

import PatientIdentifierConfigForm from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigForm";

export const Route = createFileRoute(
  "/_app/admin/patient_identifier_config/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  return <PatientIdentifierConfigForm />;
}

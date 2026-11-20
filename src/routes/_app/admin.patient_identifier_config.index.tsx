import { createFileRoute } from "@tanstack/react-router";

import PatientIdentifierConfigList from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigList";

export const Route = createFileRoute("/_app/admin/patient_identifier_config/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <PatientIdentifierConfigList />;
}

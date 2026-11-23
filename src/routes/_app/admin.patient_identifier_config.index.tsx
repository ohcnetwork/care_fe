import { createFileRoute } from "@tanstack/react-router";

import { patientIdentifierConfigListSearch } from "@/lib/router/search/admin";
import PatientIdentifierConfigList from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigList";

export const Route = createFileRoute("/_app/admin/patient_identifier_config/")({
  validateSearch: patientIdentifierConfigListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  return <PatientIdentifierConfigList />;
}

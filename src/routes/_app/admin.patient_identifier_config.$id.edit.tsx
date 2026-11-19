import { createFileRoute } from "@tanstack/react-router";

import PatientIdentifierConfigForm from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigForm";

export const Route = createFileRoute(
  "/_app/admin/patient_identifier_config/$id/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <PatientIdentifierConfigForm configId={id} />;
}

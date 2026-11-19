import { createFileRoute, useParams } from "@tanstack/react-router";

import PatientIdentifierConfigForm from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigForm";

export const Route = createFileRoute(
  "/_app/admin/patient_identifier_config/$id/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({
    from: "/_app/admin/patient_identifier_config/$id/edit",
  });
  return <PatientIdentifierConfigForm configId={id} />;
}

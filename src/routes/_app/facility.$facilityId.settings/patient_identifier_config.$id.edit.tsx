import { createFileRoute, useParams } from "@tanstack/react-router";

import PatientIdentifierConfigForm from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/patient_identifier_config/$id/edit",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = useParams({
    from: "/_app/facility/$facilityId/settings/patient_identifier_config/$id/edit",
  });
  return <PatientIdentifierConfigForm facilityId={facilityId} configId={id} />;
}

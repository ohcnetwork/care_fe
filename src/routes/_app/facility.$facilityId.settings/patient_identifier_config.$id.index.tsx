import { createFileRoute } from "@tanstack/react-router";

import PatientIdentifierConfigForm from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/patient_identifier_config/$id/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, id } = Route.useParams();
  return <PatientIdentifierConfigForm facilityId={facilityId} configId={id} />;
}

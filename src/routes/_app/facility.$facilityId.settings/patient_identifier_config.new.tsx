import { createFileRoute, useParams } from "@tanstack/react-router";

import PatientIdentifierConfigForm from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigForm";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/patient_identifier_config/new",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/patient_identifier_config/new",
  });
  return <PatientIdentifierConfigForm facilityId={facilityId} />;
}

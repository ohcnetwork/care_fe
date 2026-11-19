import { createFileRoute, useParams } from "@tanstack/react-router";

import PatientIdentifierConfigList from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/patient_identifier_config/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/patient_identifier_config/",
  });
  return <PatientIdentifierConfigList facilityId={facilityId} />;
}

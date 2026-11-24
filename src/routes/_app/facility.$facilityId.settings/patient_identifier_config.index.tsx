import { createFileRoute, useParams } from "@tanstack/react-router";

import { patientIdentifierConfigListSearch } from "@/lib/router/search/admin";
import PatientIdentifierConfigList from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/patient_identifier_config/",
)({
  validateSearch: patientIdentifierConfigListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = useParams({
    from: "/_app/facility/$facilityId/settings/patient_identifier_config/",
  });
  return <PatientIdentifierConfigList facilityId={facilityId} />;
}

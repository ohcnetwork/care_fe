import { createFileRoute } from "@tanstack/react-router";

import PatientIdentifierConfigList from "@/pages/settings/patientIdentifierConfig/PatientIdentifierConfigList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/settings/patient_identifier_config/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId } = Route.useParams();
  return <PatientIdentifierConfigList facilityId={facilityId} />;
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintEncounterPrescriptions } from "@/pages/Encounters/PrintEncounterPrescriptions";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/prescriptions/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, encounterId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/prescriptions/print",
  });
  return (
    <PrintEncounterPrescriptions
      facilityId={facilityId}
      patientId={patientId}
      encounterId={encounterId}
    />
  );
}

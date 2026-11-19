import { createFileRoute, useParams } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";
import BillMedicationsByNewDispense from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsByNewDispense";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_requests/patient/$patientId/bill/dispense/$encounterId",
)({
  component: RouteComponent,
  staticData: fullScreenPage,
});

function RouteComponent() {
  const { facilityId, locationId, patientId, encounterId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/medication_requests/patient/$patientId/bill/dispense/$encounterId",
  });
  return (
    <BillMedicationsByNewDispense
      facilityId={facilityId}
      locationId={locationId}
      patientId={patientId}
      encounterId={encounterId}
    />
  );
}

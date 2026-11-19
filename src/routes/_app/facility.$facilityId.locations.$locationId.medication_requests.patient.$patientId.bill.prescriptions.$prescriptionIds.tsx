import { createFileRoute } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";
import BillMedicationsByPrescriptions from "@/pages/Facility/services/pharmacy/billMedications/BillMedicationsByPrescriptions";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_requests/patient/$patientId/bill/prescriptions/$prescriptionIds",
)({
  component: RouteComponent,
  staticData: fullScreenPage,
});

function RouteComponent() {
  const { facilityId, locationId, patientId, prescriptionIds } =
    Route.useParams();
  return (
    <BillMedicationsByPrescriptions
      facilityId={facilityId}
      locationId={locationId}
      patientId={patientId}
      prescriptionIds={prescriptionIds.split(",")}
    />
  );
}

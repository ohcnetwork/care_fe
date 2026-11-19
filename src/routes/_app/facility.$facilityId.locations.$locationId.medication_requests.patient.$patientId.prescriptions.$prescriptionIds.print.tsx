import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintPrescriptions } from "@/components/Prescription/PrintPrescriptions";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_requests/patient/$patientId/prescriptions/$prescriptionIds/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, prescriptionIds } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/medication_requests/patient/$patientId/prescriptions/$prescriptionIds/print",
  });
  return (
    <PrintPrescriptions
      facilityId={facilityId}
      patientId={patientId}
      prescriptionIds={prescriptionIds.split(",")}
    />
  );
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintPrescriptions } from "@/components/Prescription/PrintPrescriptions";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/prescription/$prescriptionId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, prescriptionId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/prescription/$prescriptionId/print",
  });
  return (
    <PrintPrescriptions
      facilityId={facilityId}
      patientId={patientId}
      prescriptionIds={[prescriptionId]}
    />
  );
}

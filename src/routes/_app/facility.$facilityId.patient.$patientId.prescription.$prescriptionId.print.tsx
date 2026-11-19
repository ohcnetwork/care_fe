import { createFileRoute } from "@tanstack/react-router";

import { PrintPrescriptions } from "@/components/Prescription/PrintPrescriptions";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/prescription/$prescriptionId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, prescriptionId } = Route.useParams();
  return (
    <PrintPrescriptions
      facilityId={facilityId}
      patientId={patientId}
      prescriptionIds={[prescriptionId]}
    />
  );
}

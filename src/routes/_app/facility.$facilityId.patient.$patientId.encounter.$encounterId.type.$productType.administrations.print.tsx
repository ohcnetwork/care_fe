import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintMedicationAdministration } from "@/components/Medicine/MedicationAdministration/PrintMedicationAdministration";

import type { AdministrableProductType } from "@/types/inventory/productKnowledge/productKnowledge";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/type/$productType/administrations/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, encounterId, productType } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/type/$productType/administrations/print",
  });
  return (
    <PrintMedicationAdministration
      facilityId={facilityId}
      encounterId={encounterId}
      patientId={patientId}
      productType={productType as AdministrableProductType}
    />
  );
}

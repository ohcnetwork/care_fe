import { createFileRoute } from "@tanstack/react-router";

import { PrintMedicationReturn } from "@/pages/Facility/services/pharmacy/PrintMedicationReturn";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_return/order/$deliveryOrderId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, deliveryOrderId } = Route.useParams();
  return (
    <PrintMedicationReturn
      facilityId={facilityId}
      deliveryOrderId={deliveryOrderId}
    />
  );
}

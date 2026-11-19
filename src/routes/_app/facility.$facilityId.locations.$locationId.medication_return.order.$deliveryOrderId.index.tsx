import { createFileRoute, useParams } from "@tanstack/react-router";

import MedicationReturnShow from "@/pages/Facility/services/pharmacy/MedicationReturnShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_return/order/$deliveryOrderId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, deliveryOrderId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/medication_return/order/$deliveryOrderId/",
  });
  return (
    <MedicationReturnShow
      facilityId={facilityId}
      locationId={locationId}
      deliveryOrderId={deliveryOrderId}
    />
  );
}

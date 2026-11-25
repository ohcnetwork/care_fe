import { createFileRoute, useParams } from "@tanstack/react-router";

import { medicationReturnShowSearch } from "@/lib/router/search/pharmacy";
import MedicationReturnShow from "@/pages/Facility/services/pharmacy/MedicationReturnShow";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_return/order/$deliveryOrderId/",
)({
  validateSearch: medicationReturnShowSearch,
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

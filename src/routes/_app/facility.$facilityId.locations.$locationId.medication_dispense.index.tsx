import { createFileRoute, useParams } from "@tanstack/react-router";

import { dispenseOrderListSearch } from "@/lib/router/search/pharmacy";
import MedicationDispenseHistory from "@/pages/Facility/services/pharmacy/MedicationDispenseHistory";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_dispense/",
)({
  validateSearch: dispenseOrderListSearch,
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/medication_dispense/",
  });
  return (
    <MedicationDispenseHistory
      facilityId={facilityId}
      locationId={locationId}
    />
  );
}

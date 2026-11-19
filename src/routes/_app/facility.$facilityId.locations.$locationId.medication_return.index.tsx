import { createFileRoute, useParams } from "@tanstack/react-router";

import MedicationReturnList from "@/pages/Facility/services/pharmacy/MedicationReturnList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_return/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/medication_return/",
  });
  return (
    <MedicationReturnList facilityId={facilityId} locationId={locationId} />
  );
}

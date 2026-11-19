import { createFileRoute } from "@tanstack/react-router";

import MedicationReturnList from "@/pages/Facility/services/pharmacy/MedicationReturnList";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_return/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = Route.useParams();
  return (
    <MedicationReturnList facilityId={facilityId} locationId={locationId} />
  );
}

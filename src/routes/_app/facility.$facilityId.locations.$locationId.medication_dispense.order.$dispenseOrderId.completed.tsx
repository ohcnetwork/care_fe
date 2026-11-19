import { createFileRoute } from "@tanstack/react-router";

import DispenseOrderCompleted from "@/pages/Facility/services/pharmacy/DispenseOrderCompleted";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_dispense/order/$dispenseOrderId/completed",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, dispenseOrderId } = Route.useParams();
  return (
    <DispenseOrderCompleted
      facilityId={facilityId}
      locationId={locationId}
      dispenseOrderId={dispenseOrderId}
    />
  );
}

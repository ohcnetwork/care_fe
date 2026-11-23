import { createFileRoute, useParams } from "@tanstack/react-router";

import { PrintDispenseOrder } from "@/pages/Facility/services/pharmacy/PrintDispenseOrder";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_dispense/order/$dispenseOrderId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, dispenseOrderId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/medication_dispense/order/$dispenseOrderId/print",
  });
  return (
    <PrintDispenseOrder
      facilityId={facilityId}
      dispenseOrderId={dispenseOrderId}
      locationId={locationId}
    />
  );
}

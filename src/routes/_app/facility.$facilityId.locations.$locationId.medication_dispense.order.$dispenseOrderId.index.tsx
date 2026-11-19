import { createFileRoute, useParams } from "@tanstack/react-router";

import { fullScreenPage } from "@/lib/router/staticData";
import { DispenseOrderView } from "@/pages/Facility/services/pharmacy/DispenseOrderView";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_dispense/order/$dispenseOrderId/",
)({
  component: RouteComponent,
  staticData: fullScreenPage,
});

function RouteComponent() {
  const { facilityId, locationId, dispenseOrderId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/medication_dispense/order/$dispenseOrderId/",
  });
  return (
    <DispenseOrderView
      facilityId={facilityId}
      locationId={locationId}
      dispenseOrderId={dispenseOrderId}
    />
  );
}

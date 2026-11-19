import { createFileRoute, useParams } from "@tanstack/react-router";

import PrescriptionQueue from "@/pages/Facility/services/pharmacy/PrescriptionQueue";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_requests/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/medication_requests/",
  });
  return <PrescriptionQueue facilityId={facilityId} locationId={locationId} />;
}

import { createFileRoute } from "@tanstack/react-router";

import PrescriptionQueue from "@/pages/Facility/services/pharmacy/PrescriptionQueue";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_requests/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId } = Route.useParams();
  return <PrescriptionQueue facilityId={facilityId} locationId={locationId} />;
}

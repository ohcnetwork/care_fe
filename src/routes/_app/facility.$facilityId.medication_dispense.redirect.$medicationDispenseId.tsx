import { createFileRoute } from "@tanstack/react-router";

import MedicationDispenseRedirect from "@/pages/Facility/billing/account/components/MedicationDispenseRedirect";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/medication_dispense/redirect/$medicationDispenseId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, medicationDispenseId } = Route.useParams();
  return (
    <MedicationDispenseRedirect
      facilityId={facilityId}
      medicationDispenseId={medicationDispenseId}
    />
  );
}

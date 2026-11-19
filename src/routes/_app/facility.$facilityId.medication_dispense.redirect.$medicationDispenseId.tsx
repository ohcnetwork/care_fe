import { createFileRoute, useParams } from "@tanstack/react-router";

import MedicationDispenseRedirect from "@/pages/Facility/billing/account/components/MedicationDispenseRedirect";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/medication_dispense/redirect/$medicationDispenseId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, medicationDispenseId } = useParams({
    from: "/_app/facility/$facilityId/medication_dispense/redirect/$medicationDispenseId",
  });
  return (
    <MedicationDispenseRedirect
      facilityId={facilityId}
      medicationDispenseId={medicationDispenseId}
    />
  );
}

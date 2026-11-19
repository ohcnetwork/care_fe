import { createFileRoute, useParams } from "@tanstack/react-router";

import PrescriptionsPreviewPage from "@/pages/Facility/services/pharmacy/PrescriptionsPreviewPage";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/locations/$locationId/medication_requests/patient/$patientId/prescriptions/$prescriptionIds/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, locationId, patientId, prescriptionIds } = useParams({
    from: "/_app/facility/$facilityId/locations/$locationId/medication_requests/patient/$patientId/prescriptions/$prescriptionIds/",
  });
  return (
    <PrescriptionsPreviewPage
      facilityId={facilityId}
      patientId={patientId}
      locationId={locationId}
      prescriptionIds={prescriptionIds.split(",")}
    />
  );
}

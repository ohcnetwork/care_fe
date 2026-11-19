import { createFileRoute } from "@tanstack/react-router";

import ClinicalHistoryPage from "@/pages/Patient/History";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/history/$tab",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, tab } = Route.useParams();
  return (
    <ClinicalHistoryPage
      patientId={patientId}
      facilityId={facilityId}
      tab={tab}
      fallBackUrl={`/facility/${facilityId}/patient/${patientId}`}
    />
  );
}

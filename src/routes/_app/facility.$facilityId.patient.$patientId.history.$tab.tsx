import { createFileRoute, useParams } from "@tanstack/react-router";

import { patientQuery, startQuery } from "@/lib/router/pageQueries";
import ClinicalHistoryPage from "@/pages/Patient/History";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/history/$tab",
)({
  loader: ({ context, params }) =>
    startQuery(context, patientQuery(params.patientId, params.facilityId)),
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, tab } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/history/$tab",
  });
  return (
    <ClinicalHistoryPage
      patientId={patientId}
      facilityId={facilityId}
      tab={tab}
      fallBackUrl={`/facility/${facilityId}/patient/${patientId}`}
    />
  );
}

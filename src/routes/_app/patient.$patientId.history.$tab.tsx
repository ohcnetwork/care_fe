import { createFileRoute, useParams } from "@tanstack/react-router";

import { patientQuery, startQuery } from "@/lib/router/pageQueries";
import ClinicalHistoryPage from "@/pages/Patient/History";

export const Route = createFileRoute("/_app/patient/$patientId/history/$tab")({
  loader: ({ context, params }) =>
    startQuery(context, patientQuery(params.patientId)),
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, tab } = useParams({
    from: "/_app/patient/$patientId/history/$tab",
  });
  return (
    <ClinicalHistoryPage
      patientId={patientId}
      tab={tab}
      fallBackUrl={`/patient/${patientId}`}
    />
  );
}

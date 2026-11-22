import { createFileRoute, useParams } from "@tanstack/react-router";

import { clinicalHistoryPageSearch } from "@/lib/router/search/patient";
import ClinicalHistoryPage from "@/pages/Patient/History";

export const Route = createFileRoute("/_app/patient/$patientId/history/$tab")({
  validateSearch: clinicalHistoryPageSearch,
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

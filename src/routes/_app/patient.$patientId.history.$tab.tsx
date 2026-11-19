import { createFileRoute } from "@tanstack/react-router";

import ClinicalHistoryPage from "@/pages/Patient/History";

export const Route = createFileRoute("/_app/patient/$patientId/history/$tab")({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, tab } = Route.useParams();
  return (
    <ClinicalHistoryPage
      patientId={patientId}
      tab={tab}
      fallBackUrl={`/patient/${patientId}`}
    />
  );
}

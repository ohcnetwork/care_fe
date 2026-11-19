import { createFileRoute } from "@tanstack/react-router";

import ReportViewer from "@/pages/Encounters/ReportViewer";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/report/$reportId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { encounterId, reportId } = Route.useParams();
  return <ReportViewer encounterId={encounterId} reportId={reportId} />;
}

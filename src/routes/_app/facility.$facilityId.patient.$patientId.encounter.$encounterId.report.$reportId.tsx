import { createFileRoute, useParams } from "@tanstack/react-router";

import ReportViewer from "@/pages/Encounters/ReportViewer";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/report/$reportId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { encounterId, reportId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/report/$reportId",
  });
  return <ReportViewer encounterId={encounterId} reportId={reportId} />;
}

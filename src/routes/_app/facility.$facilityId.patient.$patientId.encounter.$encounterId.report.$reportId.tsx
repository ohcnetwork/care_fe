import { createFileRoute, useParams } from "@tanstack/react-router";

import ReportViewer from "@/pages/Encounters/ReportViewer";
import { ReportType } from "@/types/emr/report/report";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/report/$reportId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { encounterId, reportId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/encounter/$encounterId/report/$reportId",
  });
  return (
    <ReportViewer
      associatingId={encounterId}
      reportId={reportId}
      reportType={ReportType.DISCHARGE_SUMMARY}
    />
  );
}

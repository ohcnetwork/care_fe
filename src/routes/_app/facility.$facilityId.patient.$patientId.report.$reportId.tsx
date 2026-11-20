import { createFileRoute, useParams } from "@tanstack/react-router";

import ReportViewer from "@/pages/Encounters/ReportViewer";
import { ReportType } from "@/types/emr/report/report";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/report/$reportId",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, reportId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/report/$reportId",
  });
  return (
    <ReportViewer
      associatingId={patientId}
      reportId={reportId}
      reportType={ReportType.PATIENT_SUMMARY}
    />
  );
}

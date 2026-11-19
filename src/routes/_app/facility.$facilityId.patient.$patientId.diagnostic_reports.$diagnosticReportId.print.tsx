import { createFileRoute } from "@tanstack/react-router";

import DiagnosticReportPrint from "@/pages/Facility/services/diagnosticReports/DiagnosticReportPrint";

export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/diagnostic_reports/$diagnosticReportId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, diagnosticReportId } = Route.useParams();
  return (
    <DiagnosticReportPrint
      patientId={patientId}
      diagnosticReportId={diagnosticReportId}
    />
  );
}

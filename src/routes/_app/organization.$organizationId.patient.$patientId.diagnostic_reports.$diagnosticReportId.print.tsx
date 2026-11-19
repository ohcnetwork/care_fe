import { createFileRoute, useParams } from "@tanstack/react-router";

import DiagnosticReportPrint from "@/pages/Facility/services/diagnosticReports/DiagnosticReportPrint";

export const Route = createFileRoute(
  "/_app/organization/$organizationId/patient/$patientId/diagnostic_reports/$diagnosticReportId/print",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, diagnosticReportId } = useParams({
    from: "/_app/organization/$organizationId/patient/$patientId/diagnostic_reports/$diagnosticReportId/print",
  });
  return (
    <DiagnosticReportPrint
      patientId={patientId}
      diagnosticReportId={diagnosticReportId}
    />
  );
}

import { createFileRoute, useParams } from "@tanstack/react-router";

import DiagnosticReportView from "@/pages/Facility/services/diagnosticReports/DiagnosticReportView";

// An index route: it must not become the parent of the print route.
export const Route = createFileRoute(
  "/_app/organization/$organizationId/patient/$patientId/diagnostic_reports/$diagnosticReportId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { patientId, diagnosticReportId } = useParams({
    from: "/_app/organization/$organizationId/patient/$patientId/diagnostic_reports/$diagnosticReportId/",
  });
  return (
    <DiagnosticReportView
      patientId={patientId}
      diagnosticReportId={diagnosticReportId}
    />
  );
}

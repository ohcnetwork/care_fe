import { createFileRoute, useParams } from "@tanstack/react-router";

import DiagnosticReportView from "@/pages/Facility/services/diagnosticReports/DiagnosticReportView";

// An index route: it must not become the parent of the print route.
export const Route = createFileRoute(
  "/_app/facility/$facilityId/patient/$patientId/diagnostic_reports/$diagnosticReportId/",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { facilityId, patientId, diagnosticReportId } = useParams({
    from: "/_app/facility/$facilityId/patient/$patientId/diagnostic_reports/$diagnosticReportId/",
  });
  return (
    <DiagnosticReportView
      patientId={patientId}
      facilityId={facilityId}
      diagnosticReportId={diagnosticReportId}
    />
  );
}
